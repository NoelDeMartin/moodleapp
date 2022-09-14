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

import { Meta, moduleMetadata, Story } from '@storybook/angular';

import { story } from '@/storybook/utils/helpers';
import { StorybookModule } from '@/storybook/storybook.module';

import images from '@/storybook/fixtures/images.json';
import { CoreCoursesCourseListItemComponent } from '@features/courses/components/course-list-item/course-list-item';
import { CoreDownloadRefreshComponent } from '@components/download-refresh/download-refresh';
import { CoreFormatTextDirective } from '@directives/format-text';
import { CoreProgressBarComponent } from '@components/progress-bar/progress-bar';
import type {
    CoreCourseListItem,
    CoreEnrolGetUsersCoursesWSResponse,
    CoreEnrolledCourseData,
} from '@features/courses/services/courses';
import { APP_INITIALIZER } from '@angular/core';
import { CoreSitesStub } from '@/storybook/stubs/services/sites';
import { CoreFilterGetAvailableInContextResult } from '@features/filter/services/filter';
import { CoreFilterDelegateStub } from '@/storybook/stubs/services/filters-delegate';
import { CoreFaIconDirective } from '@directives/fa-icon';
import { CoreCourseStub } from '@/storybook/stubs/services/course';
import { CoreConstants } from '@/core/constants';

// TODO:
// - use image fixtures, instead of base64 strings
// - refactor justDownloaded definition?
// - fix re-rendering or make reactive https://github.com/storybookjs/storybook/issues/14823

interface Args {
    layout: 'grid'|'list';
    showDownload: boolean;
    justDownloaded: boolean;
    isEnrolled: boolean;
    courseImage: keyof typeof images | string;
    // TODO download status (loading, failed, refresh, etc.)
    courseFullName: string;
    courseShortName: string;
    courseCategoryName: string;
    courseProgress: number;
    courseCompletionUserTracked: boolean;
    courseIsFavourite: boolean;
    courseIsHidden: boolean;
    courseEnrollmentMethods: string[];
}

let initializeServices = () => {
    //
};

// TODO make sure this casting does something failing.
export default <Meta<Args>> {
    title: 'Core/Courses/Course List Item',
    component: CoreCoursesCourseListItemComponent,
    args: {
        layout: 'grid',
        showDownload: true,
        justDownloaded: true,
        isEnrolled: true,
        courseFullName: 'Introduction to digital literacy',
        courseShortName: 'Digital literacy',
        courseCategoryName: 'Arts and media',
        courseProgress: 50,
        courseCompletionUserTracked: true,
        courseIsFavourite: false,
        courseIsHidden: false,
        courseImage: 'digitalLiteracy',
        courseEnrollmentMethods: ['self', 'guest', 'paypal'],
    },
    argTypes: {
        layout: {
            control: {
                type: 'select',
                options: ['grid', 'list'],
            },
        },
        showDownload: { control: { type: 'boolean' } },
        justDownloaded: { control: { type: 'boolean' } },
        isEnrolled: { control: { type: 'boolean' } },
        courseProgress: {
            control: {
                type: 'range',
                min: 0,
                max: 100,
            },
        },
        courseImage: {
            control: {
                type: 'select',
                options: ['digitalLiteracy', 'celebratingCultures', 'None'],
            },
        },
        courseCompletionUserTracked: { control: { type: 'boolean' } },
        courseIsFavourite: { control: { type: 'boolean' } },
        courseIsHidden: { control: { type: 'boolean' } },
        courseEnrollmentMethods: {
            control: {
                type: 'multi-select' ,
                options: ['self', 'guest', 'paypal'],
            },
        },
    },
    decorators: [
        moduleMetadata({
            declarations: [
                CoreCoursesCourseListItemComponent,
                CoreDownloadRefreshComponent,
                CoreFormatTextDirective,
                CoreProgressBarComponent,
                CoreFaIconDirective,
            ],
            imports: [StorybookModule],
            providers: [
                {
                    provide: APP_INITIALIZER,
                    multi: true,
                    useValue: () => {
                        CoreFilterDelegateStub.resolveHandlers();

                        initializeServices();
                    },
                },
            ],
        }),
    ],
};

const Template: Story<Args> = (args) => {
    const course: CoreEnrolledCourseData = {
        id: 1,
        shortname: args.courseShortName,
        fullname: args.courseFullName,
        displayname: `${args.courseShortName} ${args.courseFullName}`,
        summary: 'Lorem ipsum dolor',
        summaryformat: 2,
        completionusertracked: args.courseCompletionUserTracked,
        isfavourite: args.courseIsFavourite,
        hidden: args.courseIsHidden,
    };

    if (args.isEnrolled) {
        course.progress = args.courseProgress;
    }

    const courseItem: CoreCourseListItem = {
        ...course,
        categoryname: args.courseCategoryName,
        enrollmentmethods: args.courseEnrollmentMethods,
    };

    if (args.courseImage in images) {
        courseItem.courseImage = images[args.courseImage];
    }

    initializeServices = () => {
        const site = CoreSitesStub.getRequiredCurrentSite();

        site.stubWSResponse<CoreEnrolGetUsersCoursesWSResponse>('core_enrol_get_users_courses', args.isEnrolled ? [course] : []);
        site.stubWSResponse<CoreFilterGetAvailableInContextResult>('core_filters_get_available_in_context', {
            filters: [],
            warnings:[],
        });

        CoreCourseStub.stubCourseStatus(course.id, CoreConstants.DOWNLOADED);
    };

    return {
        component: CoreCoursesCourseListItemComponent,
        props: {
            course: courseItem,
            layout: args.layout,
            showDownload: args.showDownload,
            justDownloaded: args.justDownloaded,
        },
    };
};

export const Primary = story(Template);
