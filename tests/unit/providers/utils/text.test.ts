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
import { Platform } from 'ionic-angular';
import { when, anyString, verify } from 'ts-mockito';
import UnitTestCase from '@testing/UnitTestCase';

const test = new UnitTestCase(CoreTextUtilsProvider, {
    dependencies: [
        null,
        null,
        null,
        'sanitizer',
        Platform,
    ],
});

describe('CoreTextUtilsProvider', () => {

    beforeEach(() => test.reset());

    it('adds ending slashes', () => {
        const originalUrl = 'https://moodle.org';

        const textUtils = test.createInstance();
        const url = textUtils.addEndingSlash(originalUrl);

        expect(url).toEqual('https://moodle.org/');
    });

    it('doesn\'t add duplicated ending slashes', () => {
        const originalUrl = 'https://moodle.org/';

        const textUtils = test.createInstance();
        const url = textUtils.addEndingSlash(originalUrl);

        expect(url).toEqual('https://moodle.org/');
    });

    it('builds address URL for Android platforms', () => {
        // Arrange
        const address = 'Moodle Spain HQ';
        const sanitizerMock = test.getDependencyMock<DomSanitizer>('sanitizer');
        const platformMock = test.getDependencyMock(Platform);

        when(sanitizerMock.bypassSecurityTrustUrl(anyString())).thenCall((url) => url);
        when(platformMock.is('android')).thenReturn(true);

        // Act
        const textUtils = test.createInstance();
        const url = textUtils.buildAddressURL(address);

        // Assert
        expect(url).toEqual('geo:0,0?q=Moodle%20Spain%20HQ');

        verify(sanitizerMock.bypassSecurityTrustUrl(anyString())).once();
        verify(platformMock.is('android')).once();
    });

    it('builds address URL for non-Android platforms', () => {
        // Arrange
        const address = 'Moodle Spain HQ';
        const sanitizerMock = test.getDependencyMock<DomSanitizer>('sanitizer');
        const platformMock = test.getDependencyMock(Platform);

        when(sanitizerMock.bypassSecurityTrustUrl(anyString())).thenCall((url) => url);

        // Act
        const textUtils = test.createInstance();
        const url = textUtils.buildAddressURL(address);

        // Assert
        expect(url).toEqual('http://maps.google.com?q=Moodle%20Spain%20HQ');

        verify(sanitizerMock.bypassSecurityTrustUrl(anyString())).once();
        verify(platformMock.is('android')).once();
    });

});
