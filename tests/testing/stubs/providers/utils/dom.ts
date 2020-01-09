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

import { CoreAppProvider } from '@providers/app';
import { CoreConfigProvider } from '@providers/config';
import { CoreDomUtilsProvider } from '@providers/utils/dom';
import { CoreFileProvider } from '@providers/file';
import { CoreTextUtilsProvider } from '@providers/utils/text';
import { CoreUrlUtilsProvider } from '@providers/utils/url';
import { DomSanitizer } from '@angular/platform-browser';
import { Injectable } from '@angular/core';
import { LoadingController, ToastController, AlertController, Platform, ModalController, PopoverController } from 'ionic-angular';
import { mock, instance, when, anything } from '@testing/mocking';
import { TranslateService } from '@ngx-translate/core';
import CoreLoggerProviderStub from '@testing/stubs/providers/logger';

@Injectable()
export default class CoreDomUtilsProvidersStub {

    constructor() {
        const configProvider = mock(CoreConfigProvider);

        when(configProvider.get(anything(), anything()))
            .thenCall((_, defaultValue) => Promise.resolve(defaultValue));

        this.dom = new CoreDomUtilsProvider(
            instance(mock(TranslateService)),
            instance(mock(LoadingController)),
            instance(mock(ToastController)),
            instance(mock(AlertController)),
            instance(mock(CoreTextUtilsProvider)),
            instance(mock(CoreAppProvider)),
            instance(mock(Platform)),
            instance(configProvider),
            instance(mock(CoreUrlUtilsProvider)),
            instance(mock(ModalController)),
            instance(mock(DomSanitizer)),
            instance(mock(PopoverController)),
            instance(mock(CoreFileProvider)),
            new CoreLoggerProviderStub() as any,
        );
    }

    private dom: CoreDomUtilsProvider;

    handleBootstrapTooltips(): void {
        //
    }

    moveChildren(oldParent: HTMLElement, newParent: HTMLElement, prepend?: boolean): Node[] {
        return this.dom.moveChildren(oldParent, newParent, prepend);
    }

    wrapElement(el: HTMLElement, wrapper: HTMLElement): void {
        this.dom.wrapElement(el, wrapper);
    }

    getElementWidth(element: any, usePadding?: boolean, useMargin?: boolean, useBorder?: boolean,
            innerMeasure?: boolean): number {
        return this.dom.getElementWidth(element, usePadding, useMargin, useBorder, innerMeasure);
    }

}
