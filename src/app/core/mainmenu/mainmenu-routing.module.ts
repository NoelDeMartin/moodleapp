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

import { InjectionToken, Injector, ModuleWithProviders, NgModule } from '@angular/core';
import { RouterModule, ROUTES, Routes } from '@angular/router';

import { CoreArray } from '@/app/singletons/array';

import { CoreMainMenuPage } from './pages/menu/menu.page';
import { CoreMainMenuMorePage } from './pages/more/more.page';

function buildMainMenuRoutes(injector: Injector): Routes {
    const routes = CoreArray.flatten(injector.get<Routes[]>(MAIN_MENU_ROUTES, []));
    const moreRoutes = CoreArray.flatten(injector.get<Routes[]>(MAIN_MENU_MORE_ROUTES, []));

    return [
        {
            path: '',
            component: CoreMainMenuPage,
            children: [
                {
                    path: 'more',
                    children: [
                        {
                            path: '',
                            component: CoreMainMenuMorePage,
                        },
                        ...moreRoutes,
                    ],
                },
                ...routes,
                // TODO handle 404
            ],
        },
    ];
}

export const MAIN_MENU_ROUTES = new InjectionToken('MAIN_MENU_ROUTES');
export const MAIN_MENU_MORE_ROUTES = new InjectionToken('MAIN_MENU_MORE_ROUTES');

@NgModule({
    providers: [
        { provide: ROUTES, multi: true, useFactory: buildMainMenuRoutes, deps: [Injector] },
    ],
    exports: [RouterModule],
})
export class CoreMainMenuRoutingModule {

    static forChild(routes: Routes): ModuleWithProviders<CoreMainMenuRoutingModule> {
        return {
            ngModule: CoreMainMenuRoutingModule,
            providers: [
                { provide: MAIN_MENU_ROUTES, multi: true, useValue: routes },
            ],
        };
    }

    static forMoreChild(routes: Routes): ModuleWithProviders<CoreMainMenuRoutingModule> {
        return {
            ngModule: CoreMainMenuRoutingModule,
            providers: [
                { provide: MAIN_MENU_MORE_ROUTES, multi: true, useValue: routes },
            ],
        };
    }

}
