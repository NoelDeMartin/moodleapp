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

import { Injectable, Type } from '@angular/core';
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
    async navigateToSitePath(
        path: CoreMainMenuPath,
        options: CoreNavigationOptions & { siteId?: string } = {},
    ): Promise<boolean> {
        return CoreNavigator.navigateToSitePath(path, options);
    }

}

export interface CoreRoutes {}

export type CoreRoutePath = keyof CoreRoutes;

export interface CoreRouteBase<T extends string = string> {
    path: T;
}

export interface CoreLazyRoute<
    TPath extends string = string,
    TChildrenRoute extends CoreRoute = CoreRoute
> extends CoreRouteBase<TPath> {
    loadChildren: () => Promise<CoreLazyRoutesModule<TChildrenRoute>>;
}

export interface CoreEagerRoute<T extends string = string> extends CoreRouteBase<T> {
    component: Type<unknown>;
}

export type CoreRoute<T extends string = string> = CoreLazyRoute<T> | CoreEagerRoute<T>;

export interface CoreLazyRoutesModule<T extends CoreRoute> {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    __route: T;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type GenericAny = any;
type Trim<T extends string> = T extends `${infer S}/` ? S : T;
export type CoreRouteGetPaths<T extends CoreRoute> = string extends T['path']
    ? never // avoid infinite loop for generic strings
    : Trim<`/${T['path']}${CoreRouteGetChildrenPaths<T>}`>;

export type CoreRouteGetChildrenPaths<T extends CoreRoute> = T extends CoreLazyRoute<GenericAny, infer TChildRoute>
    ? CoreRouteGetPaths<TChildRoute>
    : '';

export type CoreRouteDefinition<T extends CoreRoute = CoreRoute> = {
    [k in CoreRouteGetPaths<T>]: true;
};

/**
 * Define a route.
 *
 * @param route Route.
 * @returns Route.
 */
export function defineRoute<T extends CoreRoute>(route: T): T {
    return route;
}

type CoreRoutesArray<T extends CoreRoute = CoreRoute> = Array<T>;
type CoreGetLazyRouteModule<T extends CoreRoute | CoreRoutesArray> = T extends CoreRoute
    ? CoreLazyRoutesModule<T>
    : (T extends CoreRoutesArray<infer TItem> ? CoreLazyRoutesModule<TItem> : never);

/**
 * Define a route module.
 *
 * @param module Module.
 * @returns Module.
 */
export function defineRouteModule<T extends CoreRoute | CoreRoutesArray>(module: unknown): CoreGetLazyRouteModule<T> {
    return module as unknown as CoreGetLazyRouteModule<T>;
}

export const CoreRouter = makeSingleton(CoreRouterService);
