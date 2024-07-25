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

/**
 * Get site plugins exported objects.
 *
 * @returns Site plugins exported objects.
 */
export async function getSitePluginsExportedObjects(): Promise<Record<string, unknown>> {
    const { CoreSitePluginsModuleIndexComponent } = await import ('@features/siteplugins/components/module-index/module-index');
    const { CoreSitePluginsBlockComponent } = await import ('@features/siteplugins/components/block/block');
    const { CoreSitePluginsCourseFormatComponent } = await import ('@features/siteplugins/components/course-format/course-format');
    const { CoreSitePluginsQuestionComponent } = await import ('@features/siteplugins/components/question/question');
    const { CoreSitePluginsQuestionBehaviourComponent }
        = await import ('@features/siteplugins/components/question-behaviour/question-behaviour');
    const { CoreSitePluginsUserProfileFieldComponent }
        = await import ('@features/siteplugins/components/user-profile-field/user-profile-field');
    const { CoreSitePluginsQuizAccessRuleComponent }
        = await import ('@features/siteplugins/components/quiz-access-rule/quiz-access-rule');
    const { CoreSitePluginsAssignFeedbackComponent }
        = await import ('@features/siteplugins/components/assign-feedback/assign-feedback');
    const { CoreSitePluginsAssignSubmissionComponent }
        = await import ('@features/siteplugins/components/assign-submission/assign-submission');

    /* eslint-disable @typescript-eslint/naming-convention */
    return {
        CoreSitePluginsModuleIndexComponent,
        CoreSitePluginsBlockComponent,
        CoreSitePluginsCourseFormatComponent,
        CoreSitePluginsQuestionComponent,
        CoreSitePluginsQuestionBehaviourComponent,
        CoreSitePluginsUserProfileFieldComponent,
        CoreSitePluginsQuizAccessRuleComponent,
        CoreSitePluginsAssignFeedbackComponent,
        CoreSitePluginsAssignSubmissionComponent,
    };
    /* eslint-enable @typescript-eslint/naming-convention */
}
