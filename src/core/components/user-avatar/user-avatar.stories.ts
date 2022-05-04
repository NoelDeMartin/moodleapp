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

import { moduleMetadata } from '@storybook/angular';

import barbara from '@/storybook/fixtures/users/barbara.json';
import mark from '@/storybook/fixtures/users/mark.json';
import { fixtures, fixturesSelect, meta, story, template } from '@/storybook';
import { StorybookModule } from '@/storybook/storybook.module';

import { CoreUserAvatarComponent } from './user-avatar';

interface Args {
    user: keyof typeof users;
}

const users = fixtures([barbara, mark], 'fullname');

export default meta<Args>({
    title: 'Core/User Avatar',
    component: CoreUserAvatarComponent,
    decorators: [
        moduleMetadata({
            declarations: [CoreUserAvatarComponent],
            imports: [StorybookModule],
        }),
    ],
    argTypes: {
        user: fixturesSelect(users),
    },
});

const Template = template<Args>(({ user }) => ({
    component: CoreUserAvatarComponent,
    props: {
        user: users[user],
    },
}));

export const Primary = story(Template);
