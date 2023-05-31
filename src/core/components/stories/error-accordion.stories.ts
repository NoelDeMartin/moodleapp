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

import { CoreErrorAccordionComponent } from '@components/error-accordion/error-accordion';
import { StorybookErrorAccordionModalComponent } from '@components/stories/components/error-accordion-modal';

interface Args {
    errorCode: string;
    errorDetails: string;
}

export default <Meta<Args>> {
    title: 'Core/Error Accordion',
    component: CoreErrorAccordionComponent,
    decorators: [
        moduleMetadata({
            declarations: [CoreErrorAccordionComponent],
            imports: [StorybookModule],
        }),
    ],
    args: {
        errorCode: 'endpointnotfound',
        errorDetails:
            'AJAX endpoint not found. ' +
            'This can happen if the Moodle site is too old or it blocks access to this endpoint. ' +
            'The Moodle app only supports Moodle systems 3.5 onwards.',
    },
    parameters: {
        design: {
            type: 'figma',
            // eslint-disable-next-line max-len
            url: 'https://www.figma.com/file/6r8ladLNtqEZznPsWBc48b/%F0%9F%9A%A7-Moodle-App-4-Design-System-v1.2?type=design&node-id=870%3A2483&t=eNtFGiyeRFxLOVJz-1',
        },
    },
};

const Template: Story<Args> = (args) => ({
    component: CoreErrorAccordionComponent,
    props: args,
});

export const Primary = story<Args>(Template);

export const Modal: Story<Args> = (args) => ({
    component: StorybookErrorAccordionModalComponent,
    props: args,
});
