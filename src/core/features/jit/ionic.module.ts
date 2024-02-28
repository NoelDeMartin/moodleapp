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
import { CoreJitCommonModule } from '@features/jit/common.module';
import {
    IonBackButton,
    IonModal,
    IonNav,
    IonPopover,
    IonRouterOutlet,
    IonTabs,
    IonMaxValidator,
    IonMinValidator,
} from '@ionic/angular';
import { BooleanValueAccessorDirective } from '@ionic/angular/directives/control-value-accessors/boolean-value-accessor';
import { NumericValueAccessorDirective } from '@ionic/angular/directives/control-value-accessors/numeric-value-accessor';
import { RadioValueAccessorDirective } from '@ionic/angular/directives/control-value-accessors/radio-value-accessor';
import { SelectValueAccessorDirective } from '@ionic/angular/directives/control-value-accessors/select-value-accessor';
import { TextValueAccessorDirective } from '@ionic/angular/directives/control-value-accessors/text-value-accessor';
import {
    RouterLinkDelegateDirective,
    RouterLinkWithHrefDelegateDirective,
} from '@ionic/angular/directives/navigation/router-link-delegate';

const DECLARATIONS = [
    // generated proxies
    // ...DIRECTIVES,

    // manual proxies
    IonModal,
    IonPopover,

    // ngModel accessors
    BooleanValueAccessorDirective,
    NumericValueAccessorDirective,
    RadioValueAccessorDirective,
    SelectValueAccessorDirective,
    TextValueAccessorDirective,

    // navigation
    IonTabs,
    IonRouterOutlet,
    IonBackButton,
    IonNav,
    RouterLinkDelegateDirective,
    RouterLinkWithHrefDelegateDirective,

    // validators
    IonMinValidator,
    IonMaxValidator,
];

@NgModule({
    jit: true,
    declarations: DECLARATIONS,
    exports: DECLARATIONS,
    // providers: [AngularDelegate, ModalController, PopoverController],
    imports: [CoreJitCommonModule],
})
export class CoreJitIonicModule {

    // TODO forRoot

}
