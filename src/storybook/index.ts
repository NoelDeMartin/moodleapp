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

import { ArgType } from '@storybook/addons';
import { Meta, Story } from '@storybook/angular';

export function story<T>(template: Story<T>, defaultArgs: Partial<T> = {}): Story<T> {
    const story = template.bind({});

    story.args = defaultArgs;

    return story;
}

export function template<T>(template: Story<T>): Story<T> {
    return template;
}

export function meta<Args>(meta: Meta & { argTypes: Record<keyof Args, ArgType> }): Meta {
    return meta;
}

export function fixtures<T>(items: T[], key: string): Record<string, T> {
    return items.reduce((fixtures, item) => {
        fixtures[item[key]] = item;

        return fixtures;
    }, {});
}

export function fixturesSelect(fixtures: Record<string, unknown>): ArgType {
    const values = Object.keys(fixtures);

    return {
        defaultValue: values[0],
        control: {
            type: 'select',
            options: values,
        },
    };
}
