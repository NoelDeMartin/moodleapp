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

import { AddonModDataDatabaseEntriesSource } from '@addons/mod/data/classes/database-entries-source';
import { Component, OnDestroy, ViewChild, ChangeDetectorRef, OnInit, Type } from '@angular/core';
import { ActivatedRouteSnapshot } from '@angular/router';
import { CoreRoutedItemsManagerSourcesTracker } from '@classes/items-management/routed-items-manager-sources-tracker';
import { CoreSwipeNavigationItemsManager } from '@classes/items-management/swipe-navigation-items-manager';
import { CoreCommentsCommentsComponent } from '@features/comments/components/comments/comments';
import { CoreComments } from '@features/comments/services/comments';
import { CoreCourse } from '@features/course/services/course';
import { CoreRatingInfo } from '@features/rating/services/rating';
import { IonContent, IonRefresher } from '@ionic/angular';
import { CoreGroups, CoreGroupInfo } from '@services/groups';
import { CoreNavigator } from '@services/navigator';
import { CoreSites } from '@services/sites';
import { CoreDomUtils } from '@services/utils/dom';
import { CoreUtils } from '@services/utils/utils';
import { CoreEventObserver, CoreEvents } from '@singletons/events';
import { AddonModDataComponentsCompileModule } from '../../components/components-compile.module';
import { AddonModDataProvider,
    AddonModData,
    AddonModDataData,
    AddonModDataGetDataAccessInformationWSResponse,
    AddonModDataField,
    AddonModDataTemplateType,
    AddonModDataTemplateMode,
    AddonModDataEntry,
} from '../../services/data';
import { AddonModDataHelper } from '../../services/data-helper';
import { AddonModDataSyncProvider } from '../../services/data-sync';

/**
 * Page that displays the view entry page.
 */
@Component({
    selector: 'page-addon-mod-data-entry',
    templateUrl: 'entry.html',
    styleUrls: ['../../data.scss'],
})
export class AddonModDataEntryPage implements OnInit, OnDestroy {

    @ViewChild(IonContent) content?: IonContent;
    @ViewChild(CoreCommentsCommentsComponent) comments?: CoreCommentsCommentsComponent;

    protected entryId?: number;
    protected syncObserver: CoreEventObserver; // It will observe the sync auto event.
    protected entryChangedObserver: CoreEventObserver; // It will observe the changed entry event.
    protected fields: Record<number, AddonModDataField> = {};
    protected fieldsArray: AddonModDataField[] = [];
    protected logAfterFetch = true;

    moduleId = 0;
    courseId!: number;
    offset?: number;
    title = '';
    moduleName = 'data';
    component = AddonModDataProvider.COMPONENT;
    entryLoaded = false;
    renderingEntry = false;
    loadingComments = false;
    loadingRating = false;
    selectedGroup = 0;
    // TODO it shouldn't be necessary to type this as asserted...
    entries!: AddonModDataEntriesSwipeManager;
    entry?: AddonModDataEntry;
    access?: AddonModDataGetDataAccessInformationWSResponse;
    database?: AddonModDataData;
    groupInfo?: CoreGroupInfo;
    showComments = false;
    entryHtml = '';
    siteId: string;
    extraImports: Type<unknown>[] = [AddonModDataComponentsCompileModule];
    jsData?: {
        fields: Record<number, AddonModDataField>;
        entries: Record<number, AddonModDataEntry>;
        database: AddonModDataData;
        title: string;
        group: number;
    };

    ratingInfo?: CoreRatingInfo;
    isPullingToRefresh = false; // Whether the last fetching of data was started by a pull-to-refresh action
    commentsEnabled = false;

    constructor(
        private cdr: ChangeDetectorRef,
    ) {
        this.moduleName = CoreCourse.translateModuleName('data');
        this.siteId = CoreSites.getCurrentSiteId();

        // Refresh data if this discussion is synchronized automatically.
        this.syncObserver = CoreEvents.on(AddonModDataSyncProvider.AUTO_SYNCED, (data) => {
            if (data.entryId === undefined) {
                return;
            }

            if ((data.entryId == this.entryId || data.offlineEntryId == this.entryId) && this.database?.id == data.dataId) {
                if (data.deleted) {
                    // If deleted, go back.
                    CoreNavigator.back();
                } else {
                    this.entryId = data.entryId;
                    this.entryLoaded = false;
                    this.fetchEntryData(true);
                }
            }
        }, this.siteId);

        // Refresh entry on change.
        this.entryChangedObserver = CoreEvents.on(AddonModDataProvider.ENTRY_CHANGED, (data) => {
            if (data.entryId == this.entryId && this.database?.id == data.dataId) {
                if (data.deleted) {
                    // If deleted, go back.
                    CoreNavigator.back();
                } else {
                    this.entryLoaded = false;
                    this.fetchEntryData(true);
                }
            }
        }, this.siteId);

        try {
            this.moduleId = CoreNavigator.getRequiredRouteNumberParam('cmId');
            this.courseId = CoreNavigator.getRequiredRouteNumberParam('courseId');
            this.entryId = CoreNavigator.getRouteNumberParam('entryId') || undefined;
            this.title = CoreNavigator.getRouteParam<string>('title') || '';
            this.selectedGroup = CoreNavigator.getRouteNumberParam('group') || 0;
            this.offset = CoreNavigator.getRouteNumberParam('offset');
        } catch (error) {
            CoreDomUtils.showErrorModal(error);

            CoreNavigator.back();

            return;
        }

        const source = CoreRoutedItemsManagerSourcesTracker.getOrCreateSource(
            AddonModDataDatabaseEntriesSource,
            [
                this.courseId,
                this.moduleId,
                0, // TODO get from query params?
                {
                    sortBy: '0',
                    sortDirection: 'DESC',
                    text: '',
                    searching: false,
                    searchingAdvanced: false,
                    advanced: [],
                }, // TODO get from query params?
            ],
        );

        this.entries = new AddonModDataEntriesSwipeManager(source);
    }

    /**
     * @inheritdoc
     */
    async ngOnInit(): Promise<void> {
        this.commentsEnabled = !CoreComments.areCommentsDisabledInSite();

        await this.fetchEntryData();
    }

    /**
     * Fetch the entry data.
     *
     * @param refresh Whether to refresh the current data or not.
     * @param isPtr Whether is a pull to refresh action.
     * @return Resolved when done.
     */
    protected async fetchEntryData(refresh = false, isPtr = false): Promise<void> {
        this.isPullingToRefresh = isPtr;

        try {
            this.database = await AddonModData.getDatabase(this.courseId, this.moduleId);
            this.title = this.database.name || this.title;

            this.fieldsArray = await AddonModData.getFields(this.database.id, { cmId: this.moduleId });
            this.fields = CoreUtils.arrayToObject(this.fieldsArray, 'id');

            await this.entries.start();

            this.entry = this.entries.getSelectedItem() ?? undefined;

            // TODO all of this can probably be removed...
            this.access = await AddonModData.getDatabaseAccessInformation(this.database.id, { cmId: this.moduleId });

            this.groupInfo = await CoreGroups.getActivityGroupInfo(this.database.coursemodule);
            if (this.groupInfo.visibleGroups && this.groupInfo.groups?.length) {
                // There is a bug in Moodle with All participants and visible groups (MOBILE-3597). Remove it.
                this.groupInfo.groups = this.groupInfo.groups.filter(group => group.id !== 0);
                this.groupInfo.defaultGroupId = this.groupInfo.groups[0].id;
            }

            this.selectedGroup = CoreGroups.validateGroupId(this.selectedGroup, this.groupInfo);

            const actions = AddonModDataHelper.getActions(this.database, this.access, this.entry!);

            const template = AddonModDataHelper.getTemplate(this.database, AddonModDataTemplateType.SINGLE, this.fieldsArray);
            this.entryHtml = AddonModDataHelper.displayShowFields(
                template,
                this.fieldsArray,
                this.entry!,
                this.offset,
                AddonModDataTemplateMode.SHOW,
                actions,
            );

            this.showComments = actions.comments;

            const entries: Record<number, AddonModDataEntry> = {};
            entries[this.entryId!] = this.entry!;

            // Pass the input data to the component.
            this.jsData = {
                fields: this.fields,
                entries: entries,
                database: this.database,
                title: this.title,
                group: this.selectedGroup,
            };

            if (this.logAfterFetch) {
                this.logAfterFetch = false;
                await CoreUtils.ignoreErrors(AddonModData.logView(this.database.id, this.database.name));

                // Store module viewed because this page also updates recent accessed items block.
                CoreCourse.storeModuleViewed(this.courseId, this.moduleId);
            }
        } catch (error) {
            if (!refresh) {
                // Some call failed, retry without using cache since it might be a new activity.
                return this.refreshAllData(isPtr);
            }

            CoreDomUtils.showErrorModalDefault(error, 'core.course.errorgetmodule', true);
        } finally {
            this.content?.scrollToTop();
            this.entryLoaded = true;
        }
    }

    /**
     * Refresh all the data.
     *
     * @param isPtr Whether is a pull to refresh action.
     * @return Promise resolved when done.
     */
    protected async refreshAllData(isPtr?: boolean): Promise<void> {
        const promises: Promise<void>[] = [];

        promises.push(AddonModData.invalidateDatabaseData(this.courseId));
        if (this.database) {
            promises.push(AddonModData.invalidateEntryData(this.database.id, this.entryId!));
            promises.push(CoreGroups.invalidateActivityGroupInfo(this.database.coursemodule));
            promises.push(AddonModData.invalidateEntriesData(this.database.id));
            promises.push(AddonModData.invalidateFieldsData(this.database.id));

            if (this.database.comments && this.entry && this.entry.id > 0 && this.commentsEnabled && this.comments) {
                // Refresh comments. Don't add it to promises because we don't want the comments fetch to block the entry fetch.
                this.comments.doRefresh().catch(() => {
                    // Ignore errors.
                });
            }
        }

        await Promise.all(promises).finally(() =>
            this.fetchEntryData(true, isPtr));
    }

    /**
     * Refresh the data.
     *
     * @param refresher Refresher.
     * @return Promise resolved when done.
     */
    refreshDatabase(refresher?: IonRefresher): void {
        if (!this.entryLoaded) {
            return;
        }

        this.refreshAllData(true).finally(() => {
            refresher?.complete();
        });
    }

    /**
     * Set group to see the database.
     *
     * @param groupId Group identifier to set.
     * @return Resolved when done.
     */
    async setGroup(groupId: number): Promise<void> {
        this.selectedGroup = groupId;
        this.offset = undefined;
        this.entry = undefined;
        this.entryId = undefined;
        this.entryLoaded = false;
        this.logAfterFetch = true;

        await this.fetchEntryData();
    }

    /**
     * Function called when entry is being rendered.
     */
    setRenderingEntry(rendering: boolean): void {
        this.renderingEntry = rendering;
        this.cdr.detectChanges();
    }

    /**
     * Function called when comments component is loading data.
     */
    setLoadingComments(loading: boolean): void {
        this.loadingComments = loading;
        this.cdr.detectChanges();
    }

    /**
     * Function called when rate component is loading data.
     */
    setLoadingRating(loading: boolean): void {
        this.loadingRating = loading;
        this.cdr.detectChanges();
    }

    /**
     * Function called when rating is updated online.
     */
    ratingUpdated(): void {
        AddonModData.invalidateEntryData(this.database!.id, this.entryId!);
    }

    /**
     * Component being destroyed.
     */
    ngOnDestroy(): void {
        this.syncObserver?.off();
        this.entryChangedObserver?.off();
        this.entries?.destroy();
    }

}

class AddonModDataEntriesSwipeManager extends CoreSwipeNavigationItemsManager<AddonModDataEntry> {

    protected getSelectedItemPathFromRoute(route: ActivatedRouteSnapshot): string | null {
        return route.params.entryId;
    }

}
