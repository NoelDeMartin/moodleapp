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

import { CoreLinkDirective } from '@directives/link';

import { CoreContentLinksHelperProvider } from '@core/contentlinks/providers/helper';
import { CoreDomUtilsProvider } from '@providers/utils/dom';
import { CoreSitesProvider } from '@providers/sites';
import { CoreTextUtilsProvider } from '@providers/utils/text';
import { CoreUrlUtilsProvider } from '@providers/utils/url';
import { CoreUtilsProvider } from '@providers/utils/utils';
import { when, anything, verify } from '@testing/mocking';
import CoreDomUtilsProviderStub from '@testing/stubs/providers/utils/dom';
import IonicUnitTestCase from '@testing/IonicUnitTestCase';

const test = new IonicUnitTestCase(CoreLinkDirective, {
    template: '<a href="https://moodle.org/" core-link [capture]="true">Link</a>',
    dependencies: [
        CoreUtilsProvider,
        CoreSitesProvider,
        CoreUrlUtilsProvider,
        CoreContentLinksHelperProvider,
        CoreTextUtilsProvider,
    ],
});

describe('CoreLinkDirective', () => {

    beforeEach(() => {
        test.reset();
        test.configureTestingModule({
            providers: [
                { provide: CoreDomUtilsProvider, useValue: new CoreDomUtilsProviderStub() },
            ],
        });

        withMethodStubs(test);
    });

    it('should render', () => {
        // Act
        const element = test.render();

        // Assert
        expect(element.innerHTML.trim()).not.toHaveLength(0);

        const anchor = element.querySelector('a');
        expect(anchor).not.toBeNull();
        expect(anchor.href).toEqual('https://moodle.org/');
    });

    it('should capture clicks', async () => {
        // Arrange
        const contentLinksHelper = test.getDependencyMock(CoreContentLinksHelperProvider);

        when(contentLinksHelper.handleLink(anything(), anything(), anything(), anything(), anything()))
            .thenResolve(true);

        // Act
        const element = await test.asyncRender();
        const anchor = element.querySelector('a');

        anchor.click();

        // Assert
        verify(contentLinksHelper.handleLink('https://moodle.org/', anything(), anything(), anything(), anything())).once();
    });

});

function withMethodStubs(test: IonicUnitTestCase<CoreLinkDirective>): void {
    const utils = test.getDependencyMock(CoreUtilsProvider);
    const textUtils = test.getDependencyMock(CoreTextUtilsProvider);

    when(utils.isTrueOrOne(anything()))
        .thenCall((value) => typeof value != 'undefined' && (value === true || value === 'true' || parseInt(value, 10) === 1));

    when(textUtils.decodeURI(anything())).thenCall(decodeURI);
}
