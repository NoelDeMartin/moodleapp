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

import { Injectable } from '@angular/core';
import { LoadChildren } from '@angular/router';
import { CoreMainMenuPath } from '@features/mainmenu/mainmenu-routing.module';
import { CoreNavigator, CoreNavigationOptions } from '@services/navigator';
import { makeSingleton } from '@singletons';

/**
 * Service providing type-safe routing operations.
 */
@Injectable({ providedIn: 'root' })
export class CoreRouterService {

    /**
     * Navigate to a site path, loading the site if necessary.
     *
     * @param path Site path to visit.
     * @param options Navigation and site options.
     * @returns Whether navigation suceeded.
     */
    async navigateToSitepath(
        path: CoreMainMenuPath,
        options: CoreNavigationOptions & { siteId?: string } = {},
    ): Promise<boolean> {
        return CoreNavigator.navigateToSitePath(path, options);
    }

}

export interface CoreRoutes {}

export type CoreRoutePath = keyof CoreRoutes;

export interface CoreRoute<T extends string = string> {
    path: T;
    loadChildren: LoadChildren;
}

export type CoreRouteDefinition<T extends CoreRoute> = {
    [k in `/${T['path']}`]: true;
};

/**
 *
 */
export function defineRoute<T extends string>(route: CoreRoute<T>): CoreRoute<T> {
    return route;
}

export const CoreRouter = makeSingleton(CoreRouterService);
