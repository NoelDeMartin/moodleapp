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

import { CoreLoginSitePage } from '@core/login/pages/site/site';

import { CoreAppProvider } from '@providers/app';
import { CoreDomUtilsProvider } from '@providers/utils/dom';
import { CoreLoginHelperProvider } from '@core/login/providers/helper';
import { CoreSitesProvider } from '@providers/sites';
import { FormBuilder } from '@angular/forms';
import { NavController, NavParams, Loading } from 'ionic-angular';
import { when, verify, anything, mock, instance } from '@testing/mocking';
import CoreAutoFocusDirectiveStub from '@testing/stubs/directives/auto-focus';
import IonicUnitTestCase from '@testing/IonicUnitTestCase';
import TranslatePipeStub from '@testing/stubs/pipes/translate';

const test = new IonicUnitTestCase(CoreLoginSitePage, {
    template: '<page-core-login-site></page-core-login-site>',
    dependencies: [
        NavParams,
        CoreAppProvider,
        CoreSitesProvider,
        CoreLoginHelperProvider,
        CoreDomUtilsProvider,
    ],
});

let navController;

describe('CoreLoginSitePage', () => {

    beforeEach(() => {
        navController = { push: jest.fn() };

        test.reset();
        test.configureTestingModule({
            declarations: [
                TranslatePipeStub,
                CoreAutoFocusDirectiveStub,
            ],
            providers: [
                FormBuilder,
                { provide: NavController, useValue: navController },
            ],
        });
    });

    it('should render', () => {
        // Act
        const element = test.render();

        // Assert
        expect(element.innerHTML.trim()).not.toHaveLength(0);

        const form = element.querySelector('form');
        expect(form).not.toBeNull();
    });

    it('should login sites', async () => {
        // Arrange
        const domain = 'moodle.org';
        const url = `https://${domain}/my/`;
        const siteCheckResponse = { siteUrl: `https://${domain}`, config: {} };
        const sitesProvider = test.getDependencyMock(CoreSitesProvider);

        when(sitesProvider.checkSite(anything()))
            .thenCall((url) => url === domain ? Promise.resolve(siteCheckResponse) : Promise.reject(null));

        withMethodStubs(test);

        // Act
        test.render();

        // TODO interact with the component like a user would (fill the input and submit the form)
        test.instance.connect(new Event('submit'), url);

        await test.whenAsyncOperationsCompleted();

        // Assert
        verify(sitesProvider.checkSite(domain)).once();

        expect(navController.push).toHaveBeenCalledWith('CoreLoginCredentialsPage', {
            siteUrl: siteCheckResponse.siteUrl,
            siteConfig: siteCheckResponse.config,
        });
    });

});

function withMethodStubs(test: IonicUnitTestCase<CoreLoginSitePage>): void {
    const appProvider = test.getDependencyMock(CoreAppProvider);
    const domUtils = test.getDependencyMock(CoreDomUtilsProvider);
    const sitesProvider = test.getDependencyMock(CoreSitesProvider);
    const loginHelper = test.getDependencyMock(CoreLoginHelperProvider);

    when(appProvider.isOnline()).thenReturn(true);
    when(domUtils.showModalLoading()).thenReturn(instance(mock(Loading)));
    when(sitesProvider.checkRequiredMinimumVersion(anything())).thenResolve();
    when(loginHelper.isSSOLoginNeeded(anything())).thenReturn(false);
}
