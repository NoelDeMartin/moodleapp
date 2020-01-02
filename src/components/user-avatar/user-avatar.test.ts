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

import { CoreUserAvatarComponent } from './user-avatar';

import { Component, Directive, Pipe, Input, PipeTransform } from '@angular/core';
import { CoreAppProvider } from '@providers/app';
import { CoreEventsProvider } from '@providers/events';
import { CoreSitesProvider } from '@providers/sites';
import { CoreUtilsProvider } from '@providers/utils/utils';
import { IonicModule, NavController } from 'ionic-angular';
import { mock, reset, instance } from 'ts-mockito';
import { TestBed } from '@angular/core/testing';

describe('CoreUserAvatarComponent', () => {

    const sites = mock(CoreSitesProvider);
    const utils = mock(CoreUtilsProvider);
    const appProvider = mock(CoreAppProvider);
    const eventsProvider = mock(CoreEventsProvider);

    beforeEach(() => {
        reset(sites);
        reset(utils);
        reset(appProvider);
        reset(eventsProvider);

        TestBed.configureTestingModule({
            declarations: [
                HostComponent,
                CoreUserAvatarComponent,
                CoreExternalContentDirectiveStub,
                TranslatePipeStub,
            ],
            imports: [
                IonicModule.forRoot(CoreUserAvatarComponent),
            ],
            providers: [
                NavController,
                { provide: CoreSitesProvider, useValue: instance(sites) },
                { provide: CoreUtilsProvider, useValue: instance(utils) },
                { provide: CoreAppProvider, useValue: instance(appProvider) },
                { provide: CoreEventsProvider, useValue: instance(eventsProvider) },
            ],
        });
    });

    it('should render', () => {
        const fixture = TestBed.createComponent(HostComponent);
        const element = fixture.nativeElement;

        fixture.detectChanges();

        expect(element.innerHTML.trim()).not.toHaveLength(0);
        expect(element.querySelector('img').src).toEqual(document.location.href + 'assets/img/user-avatar.png');
    });

});

@Component({
    selector: '',
    template: '<ion-avatar core-user-avatar></ion-avatar>',
})
class HostComponent {}

@Directive({
    selector: '[core-external-content]'
})
class CoreExternalContentDirectiveStub {
    @Input() siteId?: string; // Site ID to use.
}

@Pipe({
    name: 'translate',
})
export class TranslatePipeStub implements PipeTransform {

    transform(text: string): string {
        return text;
    }

}
