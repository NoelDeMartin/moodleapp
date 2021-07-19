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

import { Route } from '@angular/router';

import { dynamicMainMenuTabRoutes } from '@features/mainmenu/mainmenu-tab-routing.module';
import { Router, Translate } from '@singletons';

import { CoreSitePluginsPlugin } from './services/siteplugins';

/**
 * Public API for site plugins.
 */
export interface CoreSitePluginsPublicAPI {
    /**
     * Declare a new main menu tab route.
     *
     * @param path Route path.
     * @param component Route component.
     */
    registerMainMenuTabRoute(tab: string, component: CoreSitePluginsComponent): void;

    /**
     * Translate a plugin string.
     *
     * @param key String key.
     * @param params String params.
     * @returns Translated string.
     */
    translate(key: string, params?: unknown): string;
}

/**
 * Site plugin component.
 */
export interface CoreSitePluginsComponent {
    template?: string;
    title?: string;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    new (): any;
}

/**
 * Create public API for a given plugin.
 *
 * @param plugin Plugin data.
 * @returns Public API.
 */
export function getPublicAPI(plugin: CoreSitePluginsPlugin): CoreSitePluginsPublicAPI {
    return {
        registerMainMenuTabRoute(tab: string, component: CoreSitePluginsComponent): void {
            const route: Route = {
                path: tab,
                data: { component, plugin },
                loadChildren: () => import('@/core/features/siteplugins/pages/plugin-component/plugin-component.module')
                    .then(m => m.CoreSitePluginsPluginComponentPageModule),
            };

            const mainMenuRoutes = Router
                // /main
                .config.find(route => route.path === 'main')
                // /main/
                ?._loadedConfig?.routes[0]?.children;

            const mainMenuMoreRoutes = mainMenuRoutes
                // /main/more
                ?.find(route => route.path === 'more')
                // /main/more/
                ?._loadedConfig?.routes;

            // TODO there are other parts where main menu routes are registered, this should probably be done differently.

            dynamicMainMenuTabRoutes.push(route);
            mainMenuRoutes?.push(route);
            mainMenuMoreRoutes?.push(route);
        },

        // eslint-disable-next-line @typescript-eslint/ban-types
        translate: (key: string, params?: Object): string => Translate.instant(`plugin.${plugin.component}.${key}`, params),
    };
}
