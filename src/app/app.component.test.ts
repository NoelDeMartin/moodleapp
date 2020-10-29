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

import { NavController } from '@ionic/angular';

import { AppComponent } from '@app/app.component';
import { CoreEvents } from '@singletons/events';
import { CoreInit } from '@services/init';
import { CoreLangProvider } from '@services/lang';

import { mock, mockSingleton, renderComponent, RenderConfig } from '@/tests/utils';

describe('AppComponent', () => {

    let langProvider: CoreLangProvider;
    let navController: NavController;
    let initReadyPromise: Promise<void>;
    let initReadyResolve: () => void;
    let config: Partial<RenderConfig>;

    beforeEach(() => {
        langProvider = mock<CoreLangProvider>(['clearCustomStrings']);
        navController = mock<NavController>(['navigateRoot']);
        initReadyPromise = new Promise((resolve) => initReadyResolve = resolve);

        mockSingleton(CoreInit, { ready: () => initReadyPromise });

        config = {
            providers: [
                { provide: CoreLangProvider, useValue: langProvider },
                { provide: NavController, useValue: navController },
            ],
        };
    });

    it('should render', async () => {
        // Arrange
        initReadyResolve();

        // Act
        const fixture = await renderComponent(AppComponent, config);

        // Assert
        expect(fixture.debugElement.componentInstance).toBeTruthy();
        expect(fixture.nativeElement.innerHTML).not.toContain('Loading');
        expect(fixture.nativeElement.querySelector('ion-router-outlet')).toBeTruthy();
    });

    it('shows loading while app isn\'t ready', async () => {
        const fixture = await renderComponent(AppComponent, config);

        expect(fixture.nativeElement.innerHTML).toContain('Loading');
    });

    it('cleans up on logout', async () => {
        // Arrange
        initReadyResolve();

        // Act
        const fixture = await renderComponent(AppComponent, config);

        fixture.componentInstance.ngOnInit();
        CoreEvents.trigger(CoreEvents.LOGOUT);

        // Assert
        expect(langProvider.clearCustomStrings).toHaveBeenCalled();
        expect(navController.navigateRoot).toHaveBeenCalledWith('/login/sites');
    });

});
