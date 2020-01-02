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

import { CoreTextUtilsProvider } from '@providers/utils/text';

import { DomSanitizer } from '@angular/platform-browser';
import { mock, instance, when, anyString, reset, verify } from 'ts-mockito';
import { Platform } from 'ionic-angular';

describe('CoreTextUtilsProvider', () => {

    const sanitizer: DomSanitizer = mock<DomSanitizer>();
    const platform: Platform = mock(Platform);

    let textUtils: CoreTextUtilsProvider;

    beforeEach(() => {
        reset(sanitizer);
        reset(platform);

        textUtils = new CoreTextUtilsProvider(
            jest.fn() as any,
            jest.fn() as any,
            jest.fn() as any,
            instance(sanitizer),
            instance(platform),
        );
    });

    it('adds ending slashes', async () => {
        const originalUrl = 'https://moodle.org';

        const url = textUtils.addEndingSlash(originalUrl);

        expect(url).toEqual('https://moodle.org/');
    });

    it('doesn\'t add duplicated ending slashes', async () => {
        const originalUrl = 'https://moodle.org/';

        const url = textUtils.addEndingSlash(originalUrl);

        expect(url).toEqual('https://moodle.org/');
    });

    it('builds address URL for Android platforms', () => {
        const address = 'Moodle Spain HQ';

        when(sanitizer.bypassSecurityTrustUrl(anyString())).thenCall((url) => url);
        when(platform.is('android')).thenReturn(true);

        const url = textUtils.buildAddressURL(address);

        expect(url).toEqual('geo:0,0?q=Moodle%20Spain%20HQ');

        verify(sanitizer.bypassSecurityTrustUrl(anyString())).once();
        verify(platform.is('android')).once();
    });

    it('builds address URL for non-Android platforms', () => {
        const address = 'Moodle Spain HQ';

        when(sanitizer.bypassSecurityTrustUrl(anyString())).thenCall((url) => url);

        const url = textUtils.buildAddressURL(address);

        expect(url).toEqual('http://maps.google.com?q=Moodle%20Spain%20HQ');

        verify(sanitizer.bypassSecurityTrustUrl(anyString())).once();
        verify(platform.is('android')).once();
    });

});
