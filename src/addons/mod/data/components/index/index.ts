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
import { Component, OnDestroy, OnInit, Optional, Type } from '@angular/core';
import { Params } from '@angular/router';
import { CoreRoutedItemsManagerSourcesTracker } from '@classes/items-management/routed-items-manager-sources-tracker';
import { CoreCourseModuleMainActivityComponent } from '@features/course/classes/main-activity-component';
import { CoreCourseContentsPage } from '@features/course/pages/contents/contents';
import { CoreRatingProvider } from '@features/rating/services/rating';
import { CoreRatingSyncProvider } from '@features/rating/services/rating-sync';
import { IonContent } from '@ionic/angular';
import { CoreGroupInfo } from '@services/groups';
import { CoreNavigator } from '@services/navigator';
import { CoreDomUtils } from '@services/utils/dom';
import { CoreUtils } from '@services/utils/utils';
import { CoreEventObserver, CoreEvents } from '@singletons/events';
import {
    AddonModData,
    AddonModDataData,
    AddonModDataEntry,
    AddonModDataField,
    AddonModDataGetDataAccessInformationWSResponse,
    AddonModDataProvider,
    AddonModDataTemplateMode,
    AddonModDataTemplateType,
} from '../../services/data';
import { AddonModDataHelper } from '../../services/data-helper';
import { AddonModDataAutoSyncData, AddonModDataSyncProvider, AddonModDataSyncResult } from '../../services/data-sync';
import { AddonModDataModuleHandlerService } from '../../services/handlers/module';
import { AddonModDataPrefetchHandler } from '../../services/handlers/prefetch';
import { AddonModDataComponentsCompileModule } from '../components-compile.module';
import { AddonModDataSearchComponent } from '../search/search';
import { AddonModDataDatabaseEntriesSource, AddonModDataDatabaseEntriesSearch } from '../../classes/database-entries-source';
import { CoreTimeUtils } from '@services/utils/time';

/**
 * Component that displays a data index page.
 */
@Component({
    selector: 'addon-mod-data-index',
    templateUrl: 'addon-mod-data-index.html',
    styleUrls: ['../../data.scss'],
})
export class AddonModDataIndexComponent extends CoreCourseModuleMainActivityComponent implements OnInit, OnDestroy {

    component = AddonModDataProvider.COMPONENT;
    moduleName = 'data';

    entries?: AddonModDataDatabaseEntriesSource;
    entriesRendered = '';
    extraImports: Type<unknown>[] = [AddonModDataComponentsCompileModule];
    jsData?: {
        fields: Record<number, AddonModDataField>;
        entries: Record<number, AddonModDataEntry>;
        database: AddonModDataData;
        title: string;
        group: number;
        gotoEntry: (a: number) => void;
    };

    fetchFailed = false;
    hasOfflineRatings = false;

    protected syncEventName = AddonModDataSyncProvider.AUTO_SYNCED;
    protected entryChangedObserver?: CoreEventObserver;
    protected ratingOfflineObserver?: CoreEventObserver;
    protected ratingSyncObserver?: CoreEventObserver;
    protected entriesUnsubscribe?: () => void;

    constructor(
        protected content?: IonContent,
        @Optional() courseContentsPage?: CoreCourseContentsPage,
    ) {
        super('AddonModDataIndexComponent', content, courseContentsPage);
    }

    get isEmpty(): boolean {
        return this.entries?.getItems()?.length === 0 ?? true;
    }

    get isSearching(): boolean {
        return !!this.entries?.SEARCH.searching;
    }

    get access(): AddonModDataGetDataAccessInformationWSResponse | undefined {
        return this.entries?.access;
    }

    get database(): AddonModDataData | undefined {
        return this.entries?.database;
    }

    get foundRecordsTranslationData(): { num: number; max: number; reseturl: string } | null {
        return this.entries?.totalCount && this.entries?.maxCount
            ? {
                num: this.entries?.totalCount,
                max: this.entries?.maxCount,
                reseturl: '#',
            }
            : null;
    }

    get timeAvailable(): AddonModDataTimeAvailable {
        if (!this.access?.timeavailable) {
            return {};
        }

        const { timeavailablefrom, timeavailableto } = this.database ?? {};
        const now = CoreTimeUtils.timestamp();
        const timeAvailable = {
            from: now < (timeavailablefrom ?? 0) && timeavailablefrom,
            to: now > (timeavailableto ?? now) && timeavailableto,
        };

        return Object.entries(timeAvailable).reduce(
            (times, [name, value]) => {
                if (value) {
                    times[name] = CoreTimeUtils.userDate(value * 1000);
                }

                return times;
            },
            {},
        );
    }

    get canSearch(): boolean {
        return !!this.access?.timeavailable
            && (this.entries?.fieldsArray?.length ?? 0) > 0;
    }

    get canAdd(): boolean {
        return !!this.access?.timeavailable
            && !!this.access.canaddentry
            && (this.entries?.fieldsArray?.length ?? 0) > 0;;
    }

    get firstEntry(): number | undefined {
        return this.entries?.getItems()?.[0]?.id;
    }

    get hasComments(): boolean {
        return !!this.database?.comments;
    }

    // TODO similar to src/addons/mod/feedback/pages/attempts/attempts.ts
    get groupInfo(): CoreGroupInfo | undefined {
        return this.entries?.groupInfo;
    }

    get selectedGroup(): number | undefined {
        return this.entries?.selectedGroup;
    }

    set selectedGroup(group: number | undefined) {
        if (!this.entries) {
            return;
        }

        this.entries.selectedGroup = group;
        this.entries.setDirty(true);
    }

    /**
     * @inheritdoc
     */
    async ngOnInit(): Promise<void> {
        await super.ngOnInit();

        const entries = this.entries = CoreRoutedItemsManagerSourcesTracker.getOrCreateSource(
            AddonModDataDatabaseEntriesSource,
            [
                this.courseId,
                this.module.id,
                this.group ?? 0,
                this.getDefaultSearch(),
            ],
        );

        CoreRoutedItemsManagerSourcesTracker.addReference(entries, this);

        this.entriesUnsubscribe = entries.addListener({
            onItemsUpdated: () => {
                this.hasOffline = entries.hasOffline;
                this.hasOfflineRatings = entries.hasOfflineRatings;

                this.renderEntries();
            },
        });

        // Refresh entries on change.
        this.entryChangedObserver = CoreEvents.on(AddonModDataProvider.ENTRY_CHANGED, (eventData) => {
            if (this.database?.id == eventData.dataId) {
                this.showLoading = true;

                return this.loadContent(true);
            }
        }, this.siteId);

        // Listen for offline ratings saved and synced.
        this.ratingOfflineObserver = CoreEvents.on(CoreRatingProvider.RATING_SAVED_EVENT, (data) => {
            if (data.component == 'mod_data' && data.ratingArea == 'entry' && data.contextLevel == ContextLevel.MODULE
                    && data.instanceId == this.database?.coursemodule) {
                this.hasOfflineRatings = true;
            }
        });
        this.ratingSyncObserver = CoreEvents.on(CoreRatingSyncProvider.SYNCED_EVENT, (data) => {
            if (data.component == 'mod_data' && data.ratingArea == 'entry' && data.contextLevel == ContextLevel.MODULE
                    && data.instanceId == this.database?.coursemodule) {
                this.hasOfflineRatings = false;
            }
        });

        await this.loadContent(false, true);
    }

    /**
     * Perform the invalidate content function.
     *
     * @return Resolved when done.
     */
    protected async invalidateContent(): Promise<void> {
        await this.entries?.invalidateCache();
    }

    /**
     * Compares sync event data with current data to check if refresh content is needed.
     *
     * @param syncEventData Data receiven on sync observer.
     * @return True if refresh is needed, false otherwise.
     */
    protected isRefreshSyncNeeded(syncEventData: AddonModDataAutoSyncData): boolean {
        if (syncEventData.dataId == this.database?.id && syncEventData.entryId === undefined) {
            this.showLoading = true;
            // Refresh the data.
            this.content?.scrollToTop();

            return true;
        }

        return false;
    }

    /**
     * @inheritdoc
     */
    protected async fetchContent(refresh?: boolean, sync = false, showErrors = false): Promise<void> {
        const entries = this.entries;

        if (!entries) {
            throw new Error('can\'t load without entries source!');
        }

        refresh
            ? await entries.reload()
            : await entries.load();

        // TODO subscribe to database updated
        // this.description = this.database.intro;
        // this.dataRetrieved.emit(this.database);

        // TODO this was in the middle before, now it happens after load...
        if (sync) {
            // Try to synchronize the data.
            await CoreUtils.ignoreErrors(this.syncActivity(showErrors));
        }
    }

    /**
     * Fetch more entries, if any.
     *
     * @param infiniteComplete Complete callback for infinite loader.
     */
    async fetchMoreEntries(infiniteComplete?: () => void): Promise<void> {
        try {
            this.fetchFailed = false;

            await this.entries?.load();
        } catch (error) {
            this.fetchFailed = true;

            CoreDomUtils.showErrorModalDefault(error, 'core.course.errorgetmodule', true);
        } finally {
            infiniteComplete?.();
        }
    }

    /**
     * Display the chat users modal.
     */
    async showSearch(): Promise<void> {
        const database = this.database;
        const search = this.entries?.SEARCH;
        const fields = this.entries?.fields;

        if (!database || !search || !fields) {
            return;
        }

        const newSearch = await CoreDomUtils.openModal<AddonModDataDatabaseEntriesSearch>({
            component: AddonModDataSearchComponent,
            componentProps: { database, search, fields },
        });

        await this.searchReset(newSearch);
    }

    /**
     * Reset all search filters.
     */
    async searchReset(search?: AddonModDataDatabaseEntriesSearch): Promise<void> {
        // TODO clean up previous source
        // TODO update this.entriesUnsubscribe (and maybe others)

        this.entries = CoreRoutedItemsManagerSourcesTracker.getOrCreateSource(
            AddonModDataDatabaseEntriesSource,
            [
                this.courseId,
                this.module.id,
                this.group ?? 0,
                search ?? this.getDefaultSearch(),
            ],
        );

        await this.entries.load();
    }

    // TODO make sure that all of this happens on reload (logActivity, search reset, canAdd reset, etc.)
    // /**
    //  * Set group to see the database.
    //  *
    //  * @param groupId Group ID.
    //  * @return Resolved when new group is selected or rejected if not.
    //  */
    // async setGroup(groupId: number): Promise<void> {
    //     this.selectedGroup = groupId;
    //     this.search.page = 0;

    //     // Only update canAdd if there's any field, otheerwise, canAdd will remain false.
    //     if (this.fieldsArray.length > 0) {
    //         // Update values for current group.
    //         this.access = await AddonModData.getDatabaseAccessInformation(this.database!.id, {
    //             groupId: this.selectedGroup,
    //             cmId: this.module.id,
    //         });

    //         this.canAdd = this.access.canaddentry;
    //     }

    //     try {
    //         await this.fetchEntriesData();

    //         // Log activity view for coherence with Moodle web.
    //         return this.logActivity();
    //     } catch (error) {
    //         CoreDomUtils.showErrorModalDefault(error, 'core.course.errorgetmodule', true);
    //     }
    // }

    /**
     * Opens add entries form.
     */
    gotoAddEntries(): void {
        const params: Params = {
            title: this.module.name,
            group: this.selectedGroup,
        };

        CoreNavigator.navigateToSitePath(
            `${AddonModDataModuleHandlerService.PAGE_NAME}/${this.courseId}/${this.module.id}/edit`,
            { params },
        );
    }

    /**
     * Goto the selected entry.
     *
     * @param entryId Entry ID.
     */
    gotoEntry(entryId: number): void {
        const params: Params = {
            title: this.module.name,
            group: this.selectedGroup,
        };

        // TODO remove offsets?
        // Try to find page number and offset of the entry.
        // if (!this.search.searching) {
        //     const pageXOffset = this.entries.findIndex((entry) => entry.id == entryId);
        //     if (pageXOffset >= 0) {
        //         params.offset = this.search.page * AddonModDataProvider.PER_PAGE + pageXOffset;
        //     }
        // }

        CoreNavigator.navigateToSitePath(
            `${AddonModDataModuleHandlerService.PAGE_NAME}/${this.courseId}/${this.module.id}/${entryId}`,
            { params },
        );
    }

    /**
     * Performs the sync of the activity.
     *
     * @return Promise resolved when done.
     */
    protected sync(): Promise<AddonModDataSyncResult> {
        return AddonModDataPrefetchHandler.sync(this.module, this.courseId);
    }

    /**
     * Checks if sync has succeed from result sync data.
     *
     * @param result Data returned on the sync function.
     * @return If suceed or not.
     */
    protected hasSyncSucceed(result: AddonModDataSyncResult): boolean {
        return result.updated;
    }

    /**
     * @inheritdoc
     */
    protected async logActivity(): Promise<void> {
        if (!this.database?.id) {
            return;
        }

        await AddonModData.logView(this.database.id, this.database.name);
    }

    /**
     * @inheritdoc
     */
    ngOnDestroy(): void {
        super.ngOnDestroy();
        this.entryChangedObserver?.off();
        this.ratingOfflineObserver?.off();
        this.ratingSyncObserver?.off();
        this.entriesUnsubscribe?.();

        // TODO use manager instead?
        this.entries && CoreRoutedItemsManagerSourcesTracker.removeReference(this.entries, this);
    }

    private getDefaultSearch(): AddonModDataDatabaseEntriesSearch {
        return {
            sortBy: '0',
            sortDirection: 'DESC',
            text: '',
            searching: false,
            searchingAdvanced: false,
            advanced: [],
        };
    }

    private renderEntries(): void {
        this.entriesRendered = '';

        const access = this.access;
        const database = this.database;
        const fields = this.entries?.fields;
        const fieldsArray = this.entries?.fieldsArray;
        const group = this.selectedGroup;
        const items = this.entries?.getItems();

        if (!access || !database || !fields || !fieldsArray || group === undefined || !items) {
            return;
        }

        const singleEntryTemplate = AddonModDataHelper.getTemplate(database, AddonModDataTemplateType.LIST, fieldsArray);
        const entriesById: Record<number, AddonModDataEntry> = {};
        const entriesHTML = items.reduce(
            (html, entry) => {
                entriesById[entry.id] = entry;

                const actions = AddonModDataHelper.getActions(database, access, entry);
                const offset = 0; // TODO calculate
                // const offset = this.entries?.SEARCH.searching
                //     ? 0
                //     : this.search.page * AddonModDataProvider.PER_PAGE + index - numOfflineEntries;

                return html + AddonModDataHelper.displayShowFields(
                    singleEntryTemplate,
                    fieldsArray,
                    entry,
                    offset,
                    AddonModDataTemplateMode.LIST,
                    actions,
                );
            },
            '',
        );

        this.entriesRendered = CoreDomUtils.fixHtml(
            AddonModDataHelper.getTemplate(database, AddonModDataTemplateType.LIST_HEADER, fieldsArray) +
            entriesHTML +
            AddonModDataHelper.getTemplate(database, AddonModDataTemplateType.LIST_FOOTER, fieldsArray),
        );

        // Pass the input data to the component.
        this.jsData = {
            database,
            fields,
            group,
            entries: entriesById,
            title: this.module.name,
            gotoEntry: this.gotoEntry.bind(this),
        };
    }

}

/**
 * Database time available info.
 */
export type AddonModDataTimeAvailable = Partial<{
    from: string;
    to: string;
}>;
