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

import { FormControl, FormGroup } from '@angular/forms';

// eslint-disable-next-line @typescript-eslint/ban-types
export class CoreFormManager<T extends {} = {}> {

    title: string;
    group: FormGroup;
    data: Partial<T>;

    constructor(title: string, fields: Record<keyof T, FormControl>, data: Partial<T> = {}) {
        this.title = title;
        this.group = new FormGroup({});
        this.data = data;

        for (const [field, control] of Object.entries(fields)) {
            this.group.addControl(field, control as FormControl);
        }
    }

    get controls(): Record<string, FormControl> {
        return this.group.controls as Record<string, FormControl>;
    }

    async submit(): Promise<void> {
        // TODO
    }

    value<K extends keyof T>(field: K): T[K] {
        return this.group.controls[field as string].value;
    }

    canSubmit(): boolean {
        return this.group.valid;
    }

}
