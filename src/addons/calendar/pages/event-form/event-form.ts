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

import { AddonCalendar, AddonCalendarGetCalendarAccessInformationWSResponse } from '@addons/calendar/services/calendar';
import { AddonCalendarEventTypeOption } from '@addons/calendar/services/calendar-helper';
import { Component } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { CoreFormManager } from '@classes/form-manager';
import { CoreCategoryData, CoreCourseSearchedData, CoreEnrolledCourseData } from '@features/courses/services/courses';
import { CoreNavigator } from '@services/navigator';
import { CoreTimeUtils } from '@services/utils/time';
import { FormBuilder, Translate } from '@singletons';

// TODO diff with edit-event.ts
@Component({
    selector: 'page-addon-calendar-event-form',
    templateUrl: 'event-form.html',
})
export class AddonCalendarEventFormPageComponent {

    form: AddonCalendarEventFormManager;
    eventTypes: AddonCalendarEventTypeOption[] = [];
    categories: CoreCategoryData[] = [];
    courses: CoreCourseSearchedData[] | CoreEnrolledCourseData[] = [];
    error = false;
    protected types: { [name: string]: boolean } = {}; // Object with the supported types.

    // Maybe these can be extracted...
    dateFormat: string;
    minDate: string;
    maxDate: string;

    courseId!: number;

    constructor() {
        this.courseId = CoreNavigator.getRouteNumberParam('courseId') || 0;
        this.form = new AddonCalendarEventFormManager(this, {
            id: CoreNavigator.getRouteNumberParam('eventId'),
        });

        // Calculate format to use. ion-datetime doesn't support escaping characters ([]), so we remove them.
        this.dateFormat = CoreTimeUtils.convertPHPToMoment(Translate.instant('core.strftimedatetimeshort'))
            .replace(/[[\]]/g, '');
        this.minDate = CoreTimeUtils.getDatetimeDefaultMin();
        this.maxDate = CoreTimeUtils.getDatetimeDefaultMax();
    }

    groupCourseSelected(): void {
        // TODO
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

            if (!this.typeControl.value) {
                // Initialize event type value. If course is allowed, select it first.
                if (this.types.course) {
                    this.typeControl.setValue(AddonCalendarEventType.COURSE);
                } else {
                    this.typeControl.setValue(eventTypes[0].value);
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

}

interface EventFormData {
    id?: number;
    name: string;
    timestart: string;
    eventtype: string;
    categoryid?: string;
    courseid?: string;
    groupcourseid?: string;
}

class AddonCalendarEventFormManager extends CoreFormManager<EventFormData> {

    static getTitle(data: Partial<EventFormData>): string {
        return data.id ? 'addon.calendar.editevent' : 'addon.calendar.newevent';
    }

    static getFields(page: AddonCalendarEventFormPageComponent): Record<string, FormControl> {
        const timestamp = CoreNavigator.getRouteNumberParam('timestamp');
        const timeStart = CoreTimeUtils.toDatetimeFormat(timestamp);

        return {
            name: FormBuilder.control('', Validators.required),
            timestart: FormBuilder.control(timeStart, Validators.required),
            eventtype: FormBuilder.control('', Validators.required),
            categoryid: FormBuilder.control(''),
            courseid: FormBuilder.control(page.courseId),
            groupcourseid: FormBuilder.control(''),
        };
    }

    constructor(page: AddonCalendarEventFormPageComponent, data: Partial<EventFormData>) {
        super(
            AddonCalendarEventFormManager.getTitle(data),
            AddonCalendarEventFormManager.getFields(page),
            data,
        );
    }

}
