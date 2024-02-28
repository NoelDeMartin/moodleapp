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

import { NgModule } from '@angular/core';
import { FormArrayName, FormControlDirective, FormControlName, FormGroupDirective, FormGroupName } from '@angular/forms';
import { CoreJitInternalFormsSharedModule } from '@features/jit/internal-forms-shared.module';

export const REACTIVE_DRIVEN_DIRECTIVES = [
    FormControlDirective,
    FormGroupDirective,
    FormControlName,
    FormGroupName,
    FormArrayName,
];

@NgModule({
    jit: true,
    declarations: [REACTIVE_DRIVEN_DIRECTIVES],
    exports: [CoreJitInternalFormsSharedModule, REACTIVE_DRIVEN_DIRECTIVES],
})
export class CoreJitReactiveFormsModule {

    // TODO withConfig

}
