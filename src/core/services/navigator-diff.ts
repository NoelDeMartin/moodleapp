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

import { Params } from '@angular/router';
import { NavigationOptions } from '@ionic/angular/providers/nav-controller';

// TODO test src/core/features/login/pages/credentials/credentials.ts:248
// TODO test src/core/features/block/components/only-title-block/only-title-block.ts:46
// TODO could src/core/features/login/pages/reconnect/reconnect.ts:211 be replaced with navigateToSitePath?

// TODO when navigating to a different tab, open tab root first (to show back button)
// TODO custom directives?
// eg. routerSitePathLink to call navigateToSitePath
// eg. routerSiteHomeLink to call navigateToSiteHome
// ...

// Before
type CoreNavHelperOpenMainMenuOptions = {
    redirectPage?: string; // Route of the page to open in main menu. If not defined, default tab will be selected.
    redirectParams?: Params; // Params to pass to the selected tab if any.
    urlToOpen?: string; // URL to open once the main menu is loaded.
    navigationOptions?: NavigationOptions; // Navigation options.
};

// After
type CoreNavigationOptions = {
    animated?: boolean;
    params?: Params;
    reset?: boolean;
};

export interface CoreNavigator {

    // Before
    getCurrentPage(): string;
    // After
    isCurrent(path: string): boolean;

    // Before
    goToNoSitePage(page: string, params?: Params): Promise<void>;
    // After
    navigateToLoginCredentials(params: Params): Promise<boolean>;

    // Before - always root
    goToSiteInitialPage(options?: CoreNavHelperOpenMainMenuOptions): Promise<void>;
    // After - always root
    navigateToSiteHome(options?: Omit<CoreNavigationOptions, 'reset'>): Promise<boolean>;

    // Before
    loadPageInMainMenu(page: string, params?: Params): void;
    goInSite(path: string, pageParams: Params, siteId?: string, checkMenu?: boolean): Promise<void>;
    goInCurrentMainMenuTab(page: string, pageParams: Params): Promise<void>;
    openInSiteMainMenu(page: string, params?: Params, siteId?: string): Promise<void>;
    // After
    navigateToSitePath(
        path: string,
        options?: Omit<CoreNavigationOptions, 'reset'> & { siteId?: string },
    ): Promise<boolean>;

    // Removed
    getMainMenuId(): number;
    isMainMenuOpen(): boolean;
    setMainMenuOpen(id: number, open: boolean): void;

    // Added
    navigate(path: string, options?: CoreNavigationOptions): Promise<boolean>;
}
