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

import { APP_INITIALIZER } from '@angular/core';
import { moduleMetadata } from '@storybook/angular';

import assignment from '@/storybook/fixtures/activities/assignment.json';
import forum from '@/storybook/fixtures/activities/forum.json';
import { AddonModAssignModuleHandler } from '@addons/mod/assign/services/handlers/module';
import { AddonModForumModuleHandler } from '@addons/mod/forum/services/handlers/module';
import { CoreCollapsibleItemDirective } from '@directives/collapsible-item';
import { CoreCourseModuleCompletionComponent } from '@features/course/components/module-completion/module-completion';
import { CoreCourseModuleCompletionStatus } from '@features/course/services/course';
import { CoreCourseModuleData } from '@features/course/services/course-helper';
import { CoreCourseModuleDelegate } from '@features/course/services/module-delegate';
import { CoreEvents } from '@singletons/events';
import { CoreExternalContentDirective } from '@directives/external-content';
import { CoreFaIconDirective } from '@directives/fa-icon';
import { CoreFormatDatePipe } from '@pipes/format-date';
import { CoreFormatTextDirective } from '@directives/format-text';
import { CoreModIconComponent } from '@components/mod-icon/mod-icon';
import { CoreSites } from '@services/sites';
import { fixtures, fixturesSelect, meta, story, template } from '@/storybook';
import { StorybookModule } from '@/storybook/storybook.module';
import {
    CoreCourseModuleManualCompletionComponent,
} from '@features/course/components/module-manual-completion/module-manual-completion';
import {
    CoreCourseModuleCompletionLegacyComponent,
} from '@features/course/components/module-completion-legacy/module-completion-legacy';

import { CoreCourseModuleComponent } from './module';

interface Args {
    activity: keyof typeof activities;
    manualCompletion: ManualCompletion;
}

const activities = fixtures([assignment, forum], 'name');

enum ManualCompletion {
    NotDone = 'Not done',
    Done = 'Done',
    Disabled = 'Disabled',
}

export default meta<Args>({
    title: 'Core/Course/Module',
    component: CoreCourseModuleComponent,
    decorators: [
        moduleMetadata({
            declarations: [
                CoreCollapsibleItemDirective,
                CoreCourseModuleCompletionComponent,
                CoreCourseModuleCompletionLegacyComponent,
                CoreCourseModuleComponent,
                CoreCourseModuleManualCompletionComponent,
                CoreExternalContentDirective,
                CoreFaIconDirective,
                CoreFormatDatePipe,
                CoreFormatTextDirective,
                CoreModIconComponent,
            ],
            imports: [StorybookModule],
            providers: [
                {
                    provide: APP_INITIALIZER,
                    multi: true,
                    useValue: () => {
                        const site = CoreSites.getRequiredCurrentSite();

                        CoreCourseModuleDelegate.registerHandler(AddonModForumModuleHandler.instance);
                        CoreCourseModuleDelegate.registerHandler(AddonModAssignModuleHandler.instance);

                        CoreEvents.trigger(CoreEvents.SITE_UPDATED, site.infos, site.id);
                    },
                },
            ],
        }),
    ],
    argTypes: {
        activity: fixturesSelect(activities),
        manualCompletion: {
            name: 'manual completion',
            control: {
                type: 'radio',
                options: Object.values(ManualCompletion),
            },
        },
    },
});

const Template = template<Args>(({ activity, manualCompletion }) => {
    const module = activities[activity] as CoreCourseModuleData;

    if (manualCompletion !== ManualCompletion.Disabled) {
        module.completiondata = {
            istrackeduser: true,
            hascompletion: true,
            state: manualCompletion === ManualCompletion.Done
                ? CoreCourseModuleCompletionStatus.COMPLETION_COMPLETE
                : CoreCourseModuleCompletionStatus.COMPLETION_INCOMPLETE,
            timecompleted: manualCompletion === ManualCompletion.Done ? 1 : 0,
            overrideby: null,
            courseId: 1,
            tracking: 1,
            cmid: 1,
        };
    }

    return {
        component: CoreCourseModuleComponent,
        props: {
            module,
            showCompletionConditions: true,
        },
    };
});

export const Primary = story(Template, {
    manualCompletion: ManualCompletion.Disabled,
});
