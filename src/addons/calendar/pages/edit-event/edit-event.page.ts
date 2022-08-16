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

import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { IonRefresher } from '@ionic/angular';
import { CoreEvents } from '@singletons/events';
import { CoreGroup, CoreGroups } from '@services/groups';
import { CoreSites } from '@services/sites';
import { CoreSync } from '@services/sync';
import { CoreDomUtils } from '@services/utils/dom';
import { CoreTimeUtils } from '@services/utils/time';
import { CoreUtils } from '@services/utils/utils';
import { CoreCategoryData, CoreCourses, CoreCourseSearchedData, CoreEnrolledCourseData } from '@features/courses/services/courses';
import { CoreEditorRichTextEditorComponent } from '@features/editor/components/rich-text-editor/rich-text-editor';
import {
    AddonCalendarProvider,
    AddonCalendarGetCalendarAccessInformationWSResponse,
    AddonCalendarEvent,
    AddonCalendarEventType,
    AddonCalendar,
    AddonCalendarSubmitCreateUpdateFormDataWSParams,
} from '../../services/calendar';
import { AddonCalendarOffline } from '../../services/calendar-offline';
import { AddonCalendarEventReminder, AddonCalendarEventTypeOption, AddonCalendarHelper } from '../../services/calendar-helper';
import { AddonCalendarSync, AddonCalendarSyncProvider } from '../../services/calendar-sync';
import { CoreSite } from '@classes/site';
import { FormBuilder, Translate } from '@singletons';
import { CoreFilterHelper } from '@features/filter/services/filter-helper';
import { AddonCalendarOfflineEventDBRecord } from '../../services/database/calendar-offline';
import { CoreError } from '@classes/errors/error';
import { CoreNavigator } from '@services/navigator';
import { CanLeave } from '@guards/can-leave';
import { CoreForms } from '@singletons/form';
import { CoreLocalNotifications } from '@services/local-notifications';
import { AddonCalendarReminderTimeModalComponent } from '@addons/calendar/components/reminder-time-modal/reminder-time-modal';
import { CoreFormManager } from '@classes/form-manager';

/**
 * Page that displays a form to create/edit an event.
 */
@Component({
    selector: 'page-addon-calendar-edit-event',
    templateUrl: 'edit-event.html',
    styleUrls: ['edit-event.scss'],
})
export class AddonCalendarEditEventPage implements OnInit, OnDestroy, CanLeave {

    @ViewChild(CoreEditorRichTextEditorComponent) descriptionEditor!: CoreEditorRichTextEditorComponent;
    @ViewChild('editEventForm') formElement!: ElementRef;

    dateFormat: string;
    component = AddonCalendarProvider.COMPONENT;
    loaded = false;
    hasOffline = false;
    eventTypes: AddonCalendarEventTypeOption[] = [];
    categories: CoreCategoryData[] = [];
    courses: CoreCourseSearchedData[] | CoreEnrolledCourseData[] = [];
    groups: CoreGroup[] = [];
    loadingGroups = false;
    courseGroupSet = false;
    errors: Record<string, string>;
    error = false;
    eventRepeatId?: number;
    otherEventsCount = 0;
    eventId?: number;
    maxDate: string;
    minDate: string;

    // Form variables.
    form: AddonCalendarEventFormManager;

    // Reminders.
    notificationsEnabled = false;
    reminders: AddonCalendarEventCandidateReminder[] = [];

    courseId!: number;
    protected originalData?: AddonCalendarOfflineEventDBRecord;
    protected currentSite: CoreSite;
    protected types: { [name: string]: boolean } = {}; // Object with the supported types.
    protected showAll = false;
    protected isDestroyed = false;
    protected gotEventData = false;

    constructor() {
        this.currentSite = CoreSites.getRequiredCurrentSite();
        this.notificationsEnabled = CoreLocalNotifications.isAvailable();
        this.errors = {
            required: Translate.instant('core.required'),
        };

        // Calculate format to use. ion-datetime doesn't support escaping characters ([]), so we remove them.
        this.dateFormat = CoreTimeUtils.convertPHPToMoment(Translate.instant('core.strftimedatetimeshort'))
            .replace(/[[\]]/g, '');
        this.eventId = CoreNavigator.getRouteNumberParam('eventId') || undefined;

        this.form = new AddonCalendarEventFormManager(this, this.eventId ? 'addon.calendar.editevent' : 'addon.calendar.newevent');

        // Initialize form variables.
        this.maxDate = CoreTimeUtils.getDatetimeDefaultMax();
        this.minDate = CoreTimeUtils.getDatetimeDefaultMin();
    }

    /**
     * Component being initialized.
     */
    ngOnInit(): void {
        this.courseId = CoreNavigator.getRouteNumberParam('courseId') || 0;

        this.initReminders();
        this.fetchData().finally(() => {
            // TODO double-check how to improve this
            this.originalData = CoreUtils.clone(this.form.group.value);
            this.loaded = true;
        });
    }

    /**
     * Fetch the data needed to render the form.
     *
     * @param refresh Whether it's refreshing data.
     * @return Promise resolved when done.
     */
    protected async fetchData(): Promise<void> {
        let accessInfo: AddonCalendarGetCalendarAccessInformationWSResponse;

        this.error = false;

        // Get access info.
        try {
            accessInfo = await AddonCalendar.getAccessInformation(this.courseId);
            this.types = await AddonCalendar.getAllowedEventTypes(this.courseId);

            const promises: Promise<void>[] = [];
            const eventTypes = AddonCalendarHelper.getEventTypeOptions(this.types);

            if (!eventTypes.length) {
                throw new CoreError(Translate.instant('addon.calendar.nopermissiontoupdatecalendar'));
            }

            if (this.eventId && !this.gotEventData) {
                // Editing an event, get the event data. Wait for sync first.
                const eventId = this.eventId;

                promises.push(AddonCalendarSync.waitForSync(AddonCalendarSyncProvider.SYNC_ID).then(async () => {
                    // Do not block if the scope is already destroyed.
                    if (!this.isDestroyed && this.eventId) {
                        CoreSync.blockOperation(AddonCalendarProvider.COMPONENT, eventId);
                    }

                    let eventForm: AddonCalendarEvent | AddonCalendarOfflineEventDBRecord | undefined;

                    // Get the event offline data if there's any.
                    try {
                        eventForm = await AddonCalendarOffline.getEvent(eventId);

                        this.hasOffline = true;
                    } catch {
                        // No offline data.
                        this.hasOffline = false;
                    }

                    if (eventId > 0) {
                        // It's an online event. get its data from server.
                        const event = await AddonCalendar.getEventById(eventId);

                        if (!eventForm) {
                            eventForm = event; // Use offline data first.
                        }

                        this.eventRepeatId = event?.repeatid;
                        if (this.eventRepeatId) {

                            this.otherEventsCount = event.eventcount ? event.eventcount - 1 : 0;
                        }
                    }

                    this.gotEventData = true;

                    if (eventForm) {
                        // Load the data in the form.
                        return this.loadEventData(eventForm, this.hasOffline);
                    }

                    return;
                }));
            }

            if (this.types.category) {
                // Get the categories.
                promises.push(this.fetchCategories());
            }

            this.showAll = CoreUtils.isTrueOrOne(this.currentSite.getStoredConfig('calendar_adminseesall')) &&
                accessInfo.canmanageentries;

            if (this.types.course || this.types.groups) {
                promises.push(this.fetchCourses());
            }
            await Promise.all(promises);

            if (!this.form.value('eventtype')) {
                // Initialize event type value. If course is allowed, select it first.
                if (this.types.course) {
                    this.form.controls.eventtype.setValue(AddonCalendarEventType.COURSE);
                } else {
                    this.form.controls.eventtype.setValue(eventTypes[0].value);
                }
            }

            this.eventTypes = eventTypes;
        } catch (error) {
            CoreDomUtils.showErrorModalDefault(error, 'Error getting data.');
            this.error = true;
        }
    }

    protected async fetchCategories(): Promise<void> {
        this.categories = await CoreCourses.getCategories(0, true);
    }

    protected async fetchCourses(): Promise<void> {
        // Get the courses.
        let courses = await (this.showAll ? CoreCourses.getCoursesByField() : CoreCourses.getUserCourses());

        if (courses.length < 0) {
            this.courses = [];

            return;
        }

        const courseFillterFullname = (course: CoreCourseSearchedData | CoreEnrolledCourseData): Promise<void> =>
            CoreFilterHelper.getFiltersAndFormatText(course.fullname, 'course', course.id)
                .then((result) => {
                    course.fullname = result.text;

                    return;
                }).catch(() => {
                    // Ignore errors.
                });

        if (this.showAll) {
            // Remove site home from the list of courses.
            const siteHomeId = CoreSites.getCurrentSiteHomeId();

            if ('contacts' in courses[0]) {
                courses = (courses as CoreCourseSearchedData[]).filter((course) => course.id != siteHomeId);
            } else {
                courses = (courses as CoreEnrolledCourseData[]).filter((course) => course.id != siteHomeId);
            }
        }

        // Format the name of the courses.
        if ('contacts' in courses[0]) {
            await Promise.all((courses as CoreCourseSearchedData[]).map(courseFillterFullname));
        } else {
            await Promise.all((courses as CoreEnrolledCourseData[]).map(courseFillterFullname));
        }

        // Sort courses by name.
        this.courses = courses.sort((a, b) => {
            const compareA = a.fullname.toLowerCase();
            const compareB = b.fullname.toLowerCase();

            return compareA.localeCompare(compareB);
        });

    }

    /**
     * Load an event data into the form.
     *
     * @param event Event data.
     * @param isOffline Whether the data is from offline or not.
     * @return Promise resolved when done.
     */
    protected async loadEventData(
        event: AddonCalendarEvent | AddonCalendarOfflineEventDBRecord,
        isOffline: boolean,
    ): Promise<void> {
        if (!event) {
            return;
        }

        const offlineEvent = (event as AddonCalendarOfflineEventDBRecord);
        const onlineEvent = (event as AddonCalendarEvent);

        const courseId = isOffline ? offlineEvent.courseid : onlineEvent.course?.id;

        this.form.controls.name.setValue(event.name);
        this.form.controls.timestart.setValue(CoreTimeUtils.toDatetimeFormat(event.timestart * 1000));
        this.form.controls.eventtype.setValue(event.eventtype);
        this.form.controls.categoryid.setValue(event.categoryid || '');
        this.form.controls.courseid.setValue(courseId || '');
        this.form.controls.groupcourseid.setValue(courseId || '');
        this.form.controls.groupid.setValue(event.groupid || '');
        this.form.controls.description.setValue(event.description);
        this.form.controls.location.setValue(event.location);

        if (isOffline) {
            // It's an offline event, use the data as it is.
            this.form.controls.duration.setValue(offlineEvent.duration);
            this.form.controls.timedurationuntil.setValue(
                CoreTimeUtils.toDatetimeFormat(((offlineEvent.timedurationuntil || 0) * 1000) || Date.now()),
            );
            this.form.controls.timedurationminutes.setValue(offlineEvent.timedurationminutes || '');
            this.form.controls.repeat.setValue(!!offlineEvent.repeat);
            this.form.controls.repeats.setValue(offlineEvent.repeats || '1');
            this.form.controls.repeateditall.setValue(offlineEvent.repeateditall || 1);
        } else {
            // Online event, we'll have to calculate the data.

            if (onlineEvent.timeduration > 0) {
                this.form.controls.duration.setValue(1);
                this.form.controls.timedurationuntil.setValue(CoreTimeUtils.toDatetimeFormat(
                    (onlineEvent.timestart + onlineEvent.timeduration) * 1000,
                ));
            } else {
                // No duration.
                this.form.controls.duration.setValue(0);
                this.form.controls.timedurationuntil.setValue(CoreTimeUtils.toDatetimeFormat());
            }

            this.form.controls.timedurationminutes.setValue('');
            this.form.controls.repeat.setValue(!!onlineEvent.repeatid);
            this.form.controls.repeats.setValue(onlineEvent.eventcount || '1');
            this.form.controls.repeateditall.setValue(1);
        }

        if (event.eventtype == AddonCalendarEventType.GROUP && courseId) {
            await this.loadGroups(courseId);
        }
    }

    /**
     * Pull to refresh.
     *
     * @param refresher Refresher.
     */
    refreshData(refresher?: IonRefresher): void {
        const promises = [
            AddonCalendar.invalidateAccessInformation(this.courseId),
            AddonCalendar.invalidateAllowedEventTypes(this.courseId),
        ];

        if (this.types) {
            if (this.types.category) {
                promises.push(CoreCourses.invalidateCategories(0, true));
            }
            if (this.types.course || this.types.groups) {
                if (this.showAll) {
                    promises.push(CoreCourses.invalidateCoursesByField());
                } else {
                    promises.push(CoreCourses.invalidateUserCourses());
                }
            }
        }

        Promise.all(promises).finally(() => {
            this.fetchData().finally(() => {
                refresher?.complete();
            });
        });
    }

    /**
     * A course was selected, get its groups.
     */
    async groupCourseSelected(): Promise<void> {
        const courseId = this.form.controls.groupcourseid.value;
        if (!courseId) {
            return;
        }

        const modal = await CoreDomUtils.showModalLoading();

        try {
            await this.loadGroups(courseId);

            this.form.controls.groupid.setValue('');
        } catch (error) {
            CoreDomUtils.showErrorModalDefault(error, 'Error getting data.');
        }

        modal.dismiss();
    }

    /**
     * Load groups of a certain course.
     *
     * @param courseId Course ID.
     * @return Promise resolved when done.
     */
    protected async loadGroups(courseId: number): Promise<void> {
        this.loadingGroups = true;

        try {
            this.groups = await CoreGroups.getUserGroupsInCourse(courseId);
            this.courseGroupSet = true;
        } finally {
            this.loadingGroups = false;
        }
    }

    selectDuration(duration: string): void {
        this.form.controls.duration.setValue(duration);
    }

    /**
     * Create the event.
     */
    async submit(): Promise<void> {
        // Validate data.
        const timeStartDate = CoreTimeUtils.convertToTimestamp(this.form.value('timestart'), true);
        const timeUntilDate = CoreTimeUtils.convertToTimestamp(this.form.value('timedurationuntil'), true);
        const timeDurationMinutes = parseInt(this.form.value('timedurationminutes') || '', 10);
        let error: string | undefined;

        if (this.form.value('eventtype') == AddonCalendarEventType.COURSE && !this.form.value('courseid')) {
            error = 'core.selectacourse';
        } else if (this.form.value('eventtype') == AddonCalendarEventType.GROUP && !this.form.value('groupcourseid')) {
            error = 'core.selectacourse';
        } else if (this.form.value('eventtype') == AddonCalendarEventType.GROUP && !this.form.value('groupid')) {
            error = 'core.selectagroup';
        } else if (this.form.value('eventtype') == AddonCalendarEventType.CATEGORY && !this.form.value('categoryid')) {
            error = 'core.selectacategory';
        } else if (this.form.value('duration') == 1 && timeStartDate > timeUntilDate) {
            error = 'addon.calendar.invalidtimedurationuntil';
        } else if (this.form.value('duration') == 2 && (isNaN(timeDurationMinutes) || timeDurationMinutes < 1)) {
            error = 'addon.calendar.invalidtimedurationminutes';
        }

        if (error) {
            // Show error and stop.
            CoreDomUtils.showErrorModal(Translate.instant(error));

            return;
        }

        // Format the data to send.
        const data: AddonCalendarSubmitCreateUpdateFormDataWSParams = {
            name: this.form.value('name'),
            eventtype: this.form.value('eventtype'),
            timestart: timeStartDate,
            description: {
                text: this.form.value('description') || '',
                format: 1,
            },
            location: this.form.value('location'),
            duration: this.form.value('duration'),
            repeat: this.form.value('repeat'),
        };

        if (this.form.value('eventtype') == AddonCalendarEventType.COURSE) {
            data.courseid = this.form.value('courseid');
        } else if (this.form.value('eventtype') == AddonCalendarEventType.GROUP) {
            data.groupcourseid = this.form.value('groupcourseid');
            data.groupid = this.form.value('groupid');
        } else if (this.form.value('eventtype') == AddonCalendarEventType.CATEGORY) {
            data.categoryid = this.form.value('categoryid');
        }

        if (this.form.value('duration') == 1) {
            data.timedurationuntil = timeUntilDate;
        } else if (this.form.value('duration') == 2) {
            data.timedurationminutes = this.form.value('timedurationminutes');
        }

        if (this.form.value('repeat')) {
            data.repeats = Number(this.form.value('repeats'));
        }

        if (this.eventRepeatId) {
            data.repeatid = this.eventRepeatId;
            data.repeateditall = this.form.value('repeateditall');
        }

        // Send the data.
        const modal = await CoreDomUtils.showModalLoading('core.sending', true);
        let event: AddonCalendarEvent | AddonCalendarOfflineEventDBRecord;

        try {
            const result = await AddonCalendar.submitEvent(this.eventId, data, {
                reminders: this.eventId ? [] : this.reminders, // Only allow adding reminders for new events.
            });
            event = result.event;

            CoreForms.triggerFormSubmittedEvent(this.formElement, result.sent, this.currentSite.getId());

            if (result.sent) {
                // Event created or edited, invalidate right days & months.
                const numberOfRepetitions = this.form.value('repeat') ? this.form.value('repeats') :
                    (data.repeateditall && this.otherEventsCount ? this.otherEventsCount + 1 : 1);

                try {
                    await AddonCalendarHelper.refreshAfterChangeEvent(result.event, numberOfRepetitions);
                } catch {
                    // Ignore errors.
                }
            }

            this.returnToList(event);
        } catch (error) {
            CoreDomUtils.showErrorModalDefault(error, 'Error sending data.');
        }

        modal.dismiss();
    }

    /**
     * Convenience function to update or return to event list depending on device.
     *
     * @param event Event.
     */
    protected returnToList(event?: AddonCalendarEvent | AddonCalendarOfflineEventDBRecord): void {
        // Unblock the sync because the view will be destroyed and the sync process could be triggered before ngOnDestroy.
        this.unblockSync();

        if (this.eventId && this.eventId > 0) {
            // Editing an event.
            CoreEvents.trigger(
                AddonCalendarProvider.EDIT_EVENT_EVENT,
                { eventId: this.eventId },
                this.currentSite.getId(),
            );
        } else {
            if (event) {
                CoreEvents.trigger(
                    AddonCalendarProvider.NEW_EVENT_EVENT,
                    {
                        eventId: event.id,
                        oldEventId: this.eventId,
                    },
                    this.currentSite.getId(),
                );
            } else {
                CoreEvents.trigger(AddonCalendarProvider.NEW_EVENT_DISCARDED_EVENT, {}, this.currentSite.getId());
            }
        }

        this.originalData = undefined; // Avoid asking for confirmation.
        CoreNavigator.back();
    }

    /**
     * Discard an offline saved discussion.
     */
    async discard(): Promise<void> {
        if (!this.eventId) {
            return;
        }

        try {
            await CoreDomUtils.showConfirm(Translate.instant('core.areyousure'));

            try {
                await AddonCalendarOffline.deleteEvent(this.eventId);

                CoreForms.triggerFormCancelledEvent(this.formElement, this.currentSite.getId());

                this.returnToList();
            } catch {
                // Shouldn't happen.
                CoreDomUtils.showErrorModal('Error discarding event.');
            }
        } catch {
            // Ignore errors
        }
    }

    /**
     * Check if we can leave the page or not.
     *
     * @return Resolved with true if we can leave it, rejected if not.
     */
    async canLeave(): Promise<boolean> {
        if (AddonCalendarHelper.hasEventDataChanged(this.form.value, this.originalData)) {
            // Show confirmation if some data has been modified.
            await CoreDomUtils.showConfirm(Translate.instant('core.confirmcanceledit'));
        }

        CoreForms.triggerFormCancelledEvent(this.formElement, this.currentSite.getId());

        return true;
    }

    /**
     * Unblock sync.
     */
    protected unblockSync(): void {
        if (this.eventId) {
            CoreSync.unblockOperation(AddonCalendarProvider.COMPONENT, this.eventId);
        }
    }

    /**
     * Init reminders.
     *
     * @return Promise resolved when done.
     */
    protected async initReminders(): Promise<void> {
        // Don't init reminders when editing an event. Right now, only allow adding reminders for new events.
        if (!this.notificationsEnabled || this.eventId) {
            return;
        }

        // Check if default reminders are enabled.
        const defaultTime = await AddonCalendar.getDefaultNotificationTime(this.currentSite.getId());
        if (defaultTime === 0) {
            return;
        }

        const data = AddonCalendarProvider.convertSecondsToValueAndUnit(defaultTime);

        // Add default reminder.
        this.reminders.push({
            time: null,
            value: data.value,
            unit: data.unit,
            label: AddonCalendar.getUnitValueLabel(data.value, data.unit, true),
        });
    }

    /**
     * Add a reminder.
     */
    async addReminder(): Promise<void> {
        const reminderTime = await CoreDomUtils.openModal<number>({
            component: AddonCalendarReminderTimeModalComponent,
        });

        if (reminderTime === undefined) {
            // User canceled.
            return;
        }

        const data = AddonCalendarProvider.convertSecondsToValueAndUnit(reminderTime);

        // Add reminder.
        this.reminders.push({
            time: reminderTime,
            value: data.value,
            unit: data.unit,
            label: AddonCalendar.getUnitValueLabel(data.value, data.unit),
        });
    }

    /**
     * Remove a reminder.
     *
     * @param reminder The reminder to remove.
     */
    removeReminder(reminder: AddonCalendarEventCandidateReminder): void {
        const index = this.reminders.indexOf(reminder);
        if (index != -1) {
            this.reminders.splice(index, 1);
        }
    }

    /**
     * Page destroyed.
     */
    ngOnDestroy(): void {
        this.unblockSync();
        this.isDestroyed = true;
    }

}

type AddonCalendarEventCandidateReminder = Omit<AddonCalendarEventReminder, 'id'|'eventid'>;

interface EventFormData {
    name: string;
    timestart: string;
    eventtype: AddonCalendarEventType;
    categoryid?: string;
    groupid?: string;
    courseid?: number;
    duration?: number;
    description?: string;
    groupcourseid?: string;
    timedurationuntil?: string;
    timedurationminutes?: string;
    location?: string;
    repeat: boolean;
    repeats?: string;
    repeateditall?: number;
}

class AddonCalendarEventFormManager extends CoreFormManager<EventFormData> {

    static getFields(page: AddonCalendarEditEventPage): Record<keyof EventFormData, FormControl> {
        const timestamp = CoreNavigator.getRouteNumberParam('timestamp');
        const currentDate = CoreTimeUtils.toDatetimeFormat(timestamp);

        return {
            name: FormBuilder.control('', Validators.required),
            timestart: FormBuilder.control(currentDate, Validators.required),
            eventtype: FormBuilder.control('', Validators.required),
            categoryid: FormBuilder.control(''),
            groupid: FormBuilder.control(''),
            description: FormBuilder.control(''),
            courseid: FormBuilder.control(page.courseId),
            duration: FormBuilder.control(0),
            groupcourseid: FormBuilder.control(''),
            location: FormBuilder.control(''),
            timedurationuntil: FormBuilder.control(currentDate),
            timedurationminutes: FormBuilder.control(''),
            repeat: FormBuilder.control(false),
            repeats: FormBuilder.control('1'),
            repeateditall: FormBuilder.control(1),
        };
    }

    constructor(page: AddonCalendarEditEventPage, title: string) {
        super(title, AddonCalendarEventFormManager.getFields(page));
    }

}
