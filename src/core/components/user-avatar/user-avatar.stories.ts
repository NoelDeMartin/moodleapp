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

import barbara from '@/storybook/fixtures/barbara.json';
import mark from '@/storybook/fixtures/mark.json';
import { StorybookModule } from '@/storybook/storybook.module';
import type { Meta, Story } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { CoreUserAvatarComponent } from './user-avatar';

const USER_FIXTURES = [barbara, mark].reduce((users, user) => {
    users[user.fullname] = user;

    return users;
}, {});

export default {
    title: 'Core/User Avatar',
    component: CoreUserAvatarComponent,
    decorators: [
        moduleMetadata({
            declarations: [CoreUserAvatarComponent],
            imports: [StorybookModule],
        }),
    ],
    argTypes: {
        user: {
            control: {
                type: 'select',
                options: Object.keys(USER_FIXTURES),
            },
        },
    },
} as Meta;

const Template: Story = ({ user }) => ({
    component: CoreUserAvatarComponent,
    props: {
        user: USER_FIXTURES[user],
    },
});

export const Primary = Template.bind({});

Primary.args = {
    user: Object.keys(USER_FIXTURES)[0],
};
