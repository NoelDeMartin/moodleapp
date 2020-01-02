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

import { CoreIframeComponent } from '@components/iframe/iframe';

import { CoreDomUtilsProvider } from '@providers/utils/dom';
import { CoreIframeUtilsProvider } from '@providers/utils/iframe';
import { CoreLoggerProvider } from '@providers/logger';
import { NavController } from 'ionic-angular';
import TestCase from '@testing/ComponentTestCase';

const test = new TestCase(CoreIframeComponent, {
    template: '<core-iframe src="https://moodle.org/"></core-iframe>',
    services: [
        CoreLoggerProvider,
        CoreIframeUtilsProvider,
        CoreDomUtilsProvider,
    ],
});

describe('CoreIframeComponent', () => {

    beforeEach(() => {
        test.configureTestingModule({
            providers: [
                NavController,
            ],
        });
    });

    it('should render', () => {
        const element = test.render();

        expect(element.innerHTML.trim()).not.toHaveLength(0);
        expect(element.querySelector('iframe').src).toEqual('https://moodle.org/');
    });

});
