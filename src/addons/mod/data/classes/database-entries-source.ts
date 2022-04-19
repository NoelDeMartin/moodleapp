// (C) Copyright 2015 Moodle Pty Ltd.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import { ContextLevel } from '@/core/constants';
import {
    AddonModData,
    AddonModDataData,
    AddonModDataEntry,
    AddonModDataField,
    AddonModDataGetDataAccessInformationWSResponse,
    AddonModDataProvider,
    AddonModDataSearchEntriesAdvancedField,
    AddonModDataSearchEntriesOptions,
} from '@addons/mod/data/services/data';
import { AddonModDataHelper } from '@addons/mod/data/services/data-helper';
import { CoreRoutedItemsManagerSource } from '@classes/items-management/routed-items-manager-source';
import { CoreCommentsProvider } from '@features/comments/services/comments';
import { CoreGroupInfo, CoreGroups } from '@services/groups';
import { CoreSites } from '@services/sites';
import { CoreUtils } from '@services/utils/utils';
import { CoreEvents } from '@singletons/events';

/**
 * Provides a collection of database entries.
 */
export class AddonModDataDatabaseEntriesSource extends CoreRoutedItemsManagerSource<AddonModDataEntry> {

    // TODO override getId to serialize search properly

    readonly COURSE_ID: number;
    readonly CM_ID: number;
    readonly GROUP_ID: number;
    readonly SEARCH: AddonModDataDatabaseEntriesSearch;

    database?: AddonModDataData;
    access?: AddonModDataGetDataAccessInformationWSResponse;
    maxCount?: number;
    totalCount?: number;
    fields?: Record<string, AddonModDataField>;
    fieldsArray?: AddonModDataField[];
    selectedGroup?: number;
    groupInfo?: CoreGroupInfo;
    hasOffline = false;
    hasOfflineRatings = false;
    offlineEntryIds: Set<number> = new Set();

    constructor(courseId: number, cmId: number, groupId: number, search: AddonModDataDatabaseEntriesSearch) {
        super();

        this.COURSE_ID = courseId;
        this.CM_ID = cmId;
        this.GROUP_ID = groupId;
        this.SEARCH = search;
    }

    /**
     * @inheritdoc
     */
    getItemPath(entry: AddonModDataEntry): string {
        return entry.id.toString();
    }

    /**
     * @inheritdoc
     */
    getPageLength(): number {
        return AddonModDataProvider.PER_PAGE;
    }

    /**
     * Invalidate database cache.
     */
    async invalidateCache(): Promise<void> {
        await Promise.all([
            AddonModData.invalidateDatabaseData(this.COURSE_ID),
            this.database && AddonModData.invalidateDatabaseAccessInformationData(this.database.id),
            this.database && CoreGroups.invalidateActivityGroupInfo(this.database.coursemodule),
            this.database && AddonModData.invalidateEntriesData(this.database.id),
            this.database && AddonModData.invalidateFieldsData(this.database.id),
        ]);

        if (this.database?.comments) {
            CoreEvents.trigger(
                CoreCommentsProvider.REFRESH_COMMENTS_EVENT,
                {
                    contextLevel: ContextLevel.MODULE,
                    instanceId: this.database.coursemodule,
                },
                CoreSites.getCurrentSiteId(),
            );
        }
    }

    /**
     * @inheritdoc
     */
    async load(): Promise<void> {
        if (this.dirty || !this.database) {
            await this.loadDatabase();
        }

        await super.load();
    }

    /**
     * @inheritdoc
     */
    protected async loadPageItems(page: number): Promise<{ items: AddonModDataEntry[]; hasMoreItems: boolean }> {
        const database = this.database;
        const fieldsArray = this.fieldsArray;

        if (!database || !fieldsArray) {
            throw new Error('Can\'t load entries without database or fieldsArray');
        }

        const options: AddonModDataSearchEntriesOptions = {
            page,
            groupId: this.GROUP_ID,
            cmId: this.CM_ID,
            sort: Number(this.SEARCH.sortBy),
            order: this.SEARCH.sortDirection,
        };

        if (this.SEARCH.searching && !this.SEARCH.searchingAdvanced) {
            options.search = this.SEARCH.text;
        }

        if (this.SEARCH.searching && this.SEARCH.searchingAdvanced) {
            options.advSearch = this.SEARCH.advanced;
        }

        const result = await AddonModDataHelper.fetchEntries(database, fieldsArray, options);

        result.offlineEntries?.forEach(entry => this.offlineEntryIds.add(entry.id));

        this.hasOffline = this.hasOffline || !!result.hasOfflineActions;
        this.hasOfflineRatings = this.hasOfflineRatings || !!result.hasOfflineRatings;
        this.totalCount = result.totalcount;
        this.maxCount = result.maxcount;

        return {
            items: (result.offlineEntries ?? []).concat(result.entries),
            hasMoreItems: result.totalcount > (page + 1) * this.getPageLength(),
        };
    }

    /**
     * @inheritdoc
     */
    getPagesLoaded(): number {
        if (this.items === null) {
            return 0;
        }

        const pageLength = this.getPageLength();

        return Math.ceil((this.items.length - this.offlineEntryIds.size) / pageLength);
    }

    /**
     * @inheritdoc
     */
    reset(): void {
        super.reset();

        this.offlineEntryIds = new Set();
    }

    /**
     * Load database.
     */
    private async loadDatabase(): Promise<void> {
        this.database = await AddonModData.getDatabase(this.COURSE_ID, this.CM_ID);
        this.fieldsArray = await AddonModData.getFields(this.database.id, { cmId: this.CM_ID });
        this.groupInfo = await CoreGroups.getActivityGroupInfo(this.database.coursemodule);

        if (this.groupInfo.visibleGroups && this.groupInfo.groups?.length) {
            // There is a bug in Moodle with All participants and visible groups (MOBILE-3597). Remove it.
            this.groupInfo.groups = this.groupInfo.groups.filter(group => group.id !== 0);
            this.groupInfo.defaultGroupId = this.groupInfo.groups[0].id;
        }

        this.selectedGroup = CoreGroups.validateGroupId(this.selectedGroup, this.groupInfo);

        // TODO
        // this.search.advanced = [];

        this.fields = CoreUtils.arrayToObject(this.fieldsArray, 'id');

        this.access = await AddonModData.getDatabaseAccessInformation(this.database.id, {
            cmId: this.CM_ID,
            groupId: this.selectedGroup,
        });
    }

}

export type AddonModDataDatabaseEntriesSearch = {
    sortBy: string;
    sortDirection: string;
    text: string;
    searching: boolean;
    searchingAdvanced: boolean;
    advanced?: AddonModDataSearchEntriesAdvancedField[];
};

export type AddonModDataTransationData = {
    num: number;
    max: number;
    reseturl: string;
};
