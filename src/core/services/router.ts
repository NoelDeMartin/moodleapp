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

import { Constructor } from '@/core/utils/types';
import { Injectable, Type } from '@angular/core';
import { CoreMainMenuPath, CoreMainMenuRoutes } from '@features/mainmenu/mainmenu-routing.module';
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
     * @param route Path parameters.
     * @param routeParams Navigation and site options.
     * @param options Navigation and site options.
     * @returns Whether navigation suceeded.
     */
    async navigateToSitePath<T extends CoreMainMenuPath>(
        route: T,
        routeParams: CoreMainMenuRoutes[T],
        options: CoreNavigationOptions & { siteId?: string } = {},
    ): Promise<boolean> {
        const path = Object.entries(routeParams).reduce((path, [key, value]) => path.replace(`:${key}`, value.toString()), route);

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
    TChildrenRoute extends CoreRoute | CoreRoutesArray = CoreRoute | CoreRoutesArray
> extends CoreRouteBase<TPath> {
    loadChildren: () => Promise<Constructor<CoreLazyRoutesModule<TChildrenRoute>>>;
}

export interface CoreEagerRoute<T extends string = string> extends CoreRouteBase<T> {
    component: Type<unknown>;
}

export type CoreRoute<T extends string = string> = CoreLazyRoute<T> | CoreEagerRoute<T>;
export type CoreRoutesArray<T extends CoreRoute = CoreRoute> = Array<T>;

declare const routes: unique symbol;

export class CoreLazyRoutesModule<T extends CoreRoute | CoreRoutesArray> {

    [routes]?: T;

}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type GenericAny = any;
type Trim<T extends string> = T extends `${infer S}/` ? S : T;
export type CoreRouteGetPaths<T extends CoreRoute> = string extends T['path']
    ? never // avoid infinite loop for generic strings
    : Trim<`/${T['path']}${CoreRouteGetChildrenPaths<T>}`>;

export type CoreRouteGetChildrenPaths<T extends CoreRoute> = T extends CoreLazyRoute<GenericAny, infer TChildRoute>
    ? (TChildRoute extends CoreRoute
        ? CoreRouteGetPaths<TChildRoute>
        : TChildRoute extends CoreRoutesArray<infer TChildRoutes> ? CoreRouteGetPaths<TChildRoutes> : never)
    : '';

export type GetPathParams<T extends string> = T extends `${string}/:${infer Rest}`
    ? Rest extends `${infer Param}/${infer SubRest}` ? Param | GetPathParams<SubRest> : Rest
    : never;

export type CoreRouteDefinition<T extends CoreRoute = CoreRoute> = {
    [k in CoreRouteGetPaths<T>]: {
        [p in GetPathParams<k>]: string;
    }
};

type Cast<A, B> = A extends B ? A : B;

type Narrowable =
| string
| number
| bigint
| boolean;

type Narrow<A> = A extends Type<any> ? A : Cast<A,
| []
| (A extends Narrowable ? A : never)
| ({ [K in keyof A]: Narrow<A[K]> })
>;

// TODO this can be removed with Typescript 5.0's const Type Parameters
type NarrowCoreRoute<A> = { [K in keyof A]: Narrow<A[K]> };

/**
 * Define a route.
 *
 * @param route Route.
 * @returns Route.
 */
export function defineRoute<T extends CoreRoute>(route: NarrowCoreRoute<T>): T {
    return route as unknown as T;
}

export const CoreRouter = makeSingleton(CoreRouterService);
