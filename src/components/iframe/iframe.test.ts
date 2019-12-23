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

import { CoreIframeComponent } from './iframe';

import { Component } from '@angular/core';
import { CoreDomUtilsProvider } from '@providers/utils/dom';
import { CoreIframeUtilsProvider } from '@providers/utils/iframe';
import { CoreLoggerProvider } from '@providers/logger';
import { IonicModule, NavController } from 'ionic-angular';
import { mock, reset, instance } from 'ts-mockito';
import { TestBed } from '@angular/core/testing';

describe('CoreIframeComponent', () => {

    const logger = mock(CoreLoggerProvider);
    const iframeUtils = mock(CoreIframeUtilsProvider);
    const domUtils = mock(CoreDomUtilsProvider);

    beforeEach(() => {
        reset(logger);
        reset(iframeUtils);
        reset(domUtils);

        TestBed.configureTestingModule({
            declarations: [
                HostComponent,
                CoreIframeComponent,
            ],
            imports: [
                IonicModule.forRoot(CoreIframeComponent),
            ],
            providers: [
                NavController,
                { provide: CoreLoggerProvider, useValue: instance(logger) },
                { provide: CoreIframeUtilsProvider, useValue: instance(iframeUtils) },
                { provide: CoreDomUtilsProvider, useValue: instance(domUtils) },
            ],
        });
    });

    it('should render', () => {
        const fixture = TestBed.createComponent(HostComponent);
        const element = fixture.nativeElement;

        fixture.detectChanges();

        expect(element.innerHTML.trim()).not.toHaveLength(0);
        expect(element.querySelector('iframe').src).toEqual('https://moodle.org/');
    });

});

@Component({
    selector: '',
    template: '<core-iframe src="https://moodle.org/"></core-iframe>',
})
class HostComponent {}
