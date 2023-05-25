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

import { Constructor, Pretty } from '@/core/utils/types';
import { Injectable, Type } from '@angular/core';
import { UrlMatcher } from '@angular/router';
import { CoreMainMenuPath, CoreMainMenuRoutes } from '@features/mainmenu/mainmenu-routing.module';
import { CoreNavigator, CoreNavigationOptions } from '@services/navigator';
import { makeSingleton } from '@singletons';
import { conditionalRoutes as conditionalRoutesImpl } from '@/app/app-routing.module';

/**
 * Service providing type-safe routing operations.
 */
@Injectable({ providedIn: 'root' })
export class CoreRouterService {

    route<T>(): ComponentRoute<T> {
        return {
            navigate: relativeNavigator,
            params: getCurrentRouteParams(),
        };
    }

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
        routeParams: CoreMainMenuRoutes[T]['params'],
        options: CoreNavigationOptions & { siteId?: string } = {},
    ): Promise<boolean> {
        const path = Object.entries(routeParams).reduce((path, [key, value]) => path.replace(`:${key}`, String(value)), route);

        return CoreNavigator.navigateToSitePath(path, options);
    }

}

/**
 *
 */
function relativeNavigator(route: string, routeParams: Record<string, unknown>, options?: CoreNavigationOptions) {
    const path = Object.entries(routeParams).reduce((path, [key, value]) => path.replace(`:${key}`, String(value)), route);

    return CoreNavigator.navigate(path, options);
}

/**
 *
 */
function getCurrentRouteParams(): any {
    // TODO implement
    return {};
}

export interface CoreRoutes {}

export type CoreRoutePath = keyof CoreRoutes;

export type CoreRoutesWithPrefix<TPrefix extends string, TRoutes> = {
    [k in KeysWithPrefix<TPrefix, TRoutes>]: TRoutes[KeyWithoutPrefix<TPrefix, k>]
};

export type GetRelativeRoutes<TComponent, TRoutes> = _GetRelativeRoutes<GetComponentPaths<TComponent, TRoutes>, TRoutes>;

export type ComponentRoute<TComponent> = {
    navigate: RelativeNavigator<TComponent>;
    params: ComponentParams<TComponent>;
};

export type RelativeNavigator<TComponent> =
    <T extends GetRelativeRoutes<TComponent, CoreRoutes> = GetRelativeRoutes<TComponent, CoreRoutes>>(
        route: T,
        routeParams: { [p in GetPathParams<T>]: string | number; },
        options?: CoreNavigationOptions,
    ) => Promise<boolean>;

export type _GetRelativeRoutes<TPath extends string, TRoutes> = {
    [K in keyof TRoutes]: K extends `${TPath}/${infer Rest}`
        ? `./${Rest}`
        : never;
}[keyof TRoutes];

export type GetComponentPaths<TComponent, TRoutes> = {
    [K in keyof TRoutes]: TRoutes[K] extends { component: TComponent }
        ? Cast<K, string>
        : never
}[keyof TRoutes];

export type ComponentParams<TComponent> = GetComponentParams<TComponent, CoreRoutes>;

export type GetComponentParams<TComponent, TRoutes> = {
    [K in keyof TRoutes]: TRoutes[K] extends { component: TComponent }
        ? TRoutes[K] extends { params: infer Params } ? Params : never
        : never
}[keyof TRoutes];

type KeysWithPrefix<TPrefix extends string, TRoutes> = keyof TRoutes extends string
    ? `${TPrefix}${keyof TRoutes}`
    : never;

type KeyWithoutPrefix<TPrefix extends string, TPrefixedRoute> = TPrefixedRoute extends `${TPrefix}${infer Rest}` ? Rest : never;

export interface CoreRouteBase<TPath extends string = string, TComponent = unknown> {
    // TODO path should be optional as well (one of the two required)
    path: TPath;
    component?: Type<TComponent>;
    matcher?: UrlMatcher;
}

export interface CoreLazyRoute<
    TPath extends string = string,
    TComponent = unknown,
    TChildRoutes extends CoreRoutesArray = CoreRoutesArray
> extends CoreRouteBase<TPath, TComponent> {
    loadChildren: () => Promise<Constructor<CoreLazyRoutesModule<TChildRoutes>>>;
}

export interface CoreEagerRoute<
    TPath extends string = string,
    TComponent = unknown,
    TChildRoutes extends CoreRoutesArray = CoreRoutesArray
> extends CoreRouteBase<TPath, TComponent> {
    children?: TChildRoutes;
}

export type CoreRoute<
    TPath extends string = string,
    TComponent = unknown,
    TChildRoutes extends CoreRoutesArray = any,
> =
    CoreLazyRoute<TPath, TComponent, TChildRoutes> | CoreEagerRoute<TPath, TComponent, TChildRoutes>;
export type CoreRoutesArray<T extends CoreRoute = CoreRoute> = Array<T>;

declare const routes: unique symbol;

export class CoreLazyRoutesModule<T extends CoreRoutesArray> {

    [routes]?: T;

}

export type GetRouteDefinition<T extends CoreRoute> = string extends T['path']
    ? never // avoid treating generic strings
    : {
        [k in `/${T['path']}`]: T extends { path: StringWithoutPrefix<'/', k> }
            ? {
                component: T['component'];
            }
            : never
    } & GetChildrenRouteDefinitions<T>;

export type StringWithoutPrefix<TPrefix extends string, TString extends string> =
    TString extends `${TPrefix}${infer S}` ? S : never;

export type GetChildrenRouteDefinitions<T extends CoreRoute> =
T extends CoreRoute<infer TPath, GenericAny, infer TChildren>
    ? TChildren extends CoreRoutesArray<infer TChildRoute>
        ? string extends TChildRoute['path']
            ? {
                // avoid treating generic strings
            }
            : {
                [k in `/${TPath}/${TChildRoute['path']}`]: TChildRoute extends { path: StringWithoutPrefix<`/${TPath}/`, k> }
                    ? GetRouteDefinition<TChildRoute>[`/${TChildRoute['path']}`]
                    : never;
            }
            & HoistRoutes<{
                [k in `children-${TChildRoute['path']}`]: TChildRoute extends { path: StringWithoutPrefix<'children-', k> }
                    ? CoreRoutesWithPrefix<`/${TPath}`, GetChildrenRouteDefinitions<TChildRoute>>
                    : never
            }>
        : never
    : never;

type HoistRoutes<T> = MagicType<T[keyof T]>;
type MagicType<U> = UnionToIntersection<U> extends infer O ? { [K in keyof O]: O[K] } : never;
type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends ((k: infer I) => void) ? I : never;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type GenericAny = any;

export type GetPathParams<T extends string> = T extends `${string}/:${infer Rest}`
    ? Rest extends `${infer Param}/${infer SubRest}` ? Param | GetPathParams<`/${SubRest}`> : Rest
    : never;

export type CoreRoutesDefinition<T extends CoreRoutesArray> =
    WithParams<WithTrimmedPaths<WithoutUnknownRoutes<_CoreRoutesDefinition<T>>>>;

type Trim<T extends string> = T extends `${infer S}/` ? S : T;
type RemoveDoubleSlashes<T extends string> = T extends `${infer S}//${infer Rest}`
    ? `${S}${RemoveDoubleSlashes<`/${Rest}`>}`
    : T;

export type WithTrimmedPaths<T> = {
    [K in keyof T as K extends string ? Trim<RemoveDoubleSlashes<K>> : never]: T[K]
};
export type WithoutUnknownRoutes<T> = {
    [k in keyof T as T[k] extends { component: infer C } ? unknown extends C ? never : k : never]: T[k]
};
export type WithParams<T> = {
    [k in keyof T]: Pretty<T[k] & {
        params: {
            [j in GetPathParams<Cast<k, string>>]: string | number;
        };
    }>
};

export type _CoreRoutesDefinition<T extends CoreRoutesArray> =
    T extends CoreRoutesArray<infer TChild>
        ? Pretty<GetRouteDefinition<TChild>>
        : never;

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
type NarrowCoreRoute<T> = { [K in keyof T]: Narrow<T[K]> };
type NarrowCoreRoutes<T> = ([T] extends [[]] ? [] : NarrowCoreRoute<T>);

/**
 * @inheritdoc
 */
export function conditionalRoutes<T extends CoreRoutesArray>(routes: T, condition: () => boolean): T {
    return conditionalRoutesImpl(routes, condition) as T;
}

/**
 * Define routes.
 *
 * @param routes Routes.
 * @returns Routes.
 */
export function defineRoutes<T>(routes: NarrowCoreRoutes<T>): T {
    return routes as unknown as T;
}

export const CoreRouter = makeSingleton(CoreRouterService);
