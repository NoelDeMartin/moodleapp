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
import { makeSingleton } from '@singletons';
import { CoreNavigator, CoreNavigationOptions } from '@services/navigator';
import { CoreMainMenuPath, CoreMainMenuRoutesMetadata } from '@features/mainmenu/mainmenu-routing.module';
import { conditionalRoutes as conditionalRoutesImpl } from '@/app/app-routing.module';

/**
 * Service providing type-safe routing operations.
 */
@Injectable({ providedIn: 'root' })
export class CoreRouterService {

    /**
     * Navigate to a site path, loading the site if necessary.
     *
     * @param path Route path.
     * @param parameters Route parameters.
     * @param options Navigation and site options.
     * @returns Whether navigation suceeded.
     */
    async navigateToSitePath<T extends CoreMainMenuPath>(
        path: T,
        parameters: CoreMainMenuRoutesMetadata[T]['parameters'],
        options: CoreNavigationOptions & { siteId?: string } = {},
    ): Promise<boolean> {
        const renderedPath = Object.entries(parameters).reduce(
            (path, [key, value]) => path.replace(`:${key}`, String(value)),
            path,
        );

        return CoreNavigator.navigateToSitePath(renderedPath, options);
    }

}

export const CoreRouter = makeSingleton(CoreRouterService);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type GenericAny = any;

// TODO this can be substituted by const Type Parameters in 5.0
// See https://www.typescriptlang.org/docs/handbook/release-notes/typescript-5-0.html#const-type-parameters
type Cast<A, B> = A extends B ? A : B;
type Narrowable = | string | number | bigint | boolean;
type Narrow<A> = A extends Type<GenericAny>
    ? A
    : Cast<A, [] | (A extends Narrowable ? A : never) | ({ [K in keyof A]: Narrow<A[K]> })>;
type NarrowRoute<T> = { [K in keyof T]: Narrow<T[K]> };
type NarrowRoutes<T> = ([T] extends [[]] ? [] : NarrowRoute<T>);

type StringWithPrefix<TPrefix extends string, TString extends string> = `${TPrefix}${TString}`;
type StringWithoutPrefix<TPrefix extends string, TString extends string> = TString extends `${TPrefix}${infer S}` ? S : never;

type UnionToIntersection<T> = (T extends GenericAny ? (value: T) => void : never) extends ((value: infer TValue) => void)
    ? TValue
    : never;

type HoistKeys<T> = UnionToIntersection<T[keyof T]>;
type AddKeysPrefix<TPrefix extends string, TObject> = {
    [K in keyof TObject as K extends string ? StringWithPrefix<TPrefix, K> : never]: TObject[K]
};

type GetRoutesMetadata<T extends CoreRoutesArray> = T extends CoreRoutesArray<infer TChild>
    ? Pretty<GetRouteMetadata<TChild>>
    : never;
type GetRouteMetadata<T extends CoreRoute> = string extends T['path']
    ? never // avoid treating generic strings
    : {
        [k in `/${T['path']}`]: T extends { path: StringWithoutPrefix<'/', k> }
            ? {
                component: T['component'];
            }
            : never
    } & GetChildrenRouteMetadata<T>;
type GetChildrenRouteMetadata<T extends CoreRoute> = T extends CoreRoute<infer TPath, GenericAny, infer TChildren>
    ? TChildren extends CoreRoutesArray<infer TChildRoute>
        ? string extends TChildRoute['path']
            ? {
                // avoid treating generic strings
            }
            : {
                [k in `/${TPath}/${TChildRoute['path']}`]: TChildRoute extends { path: StringWithoutPrefix<`/${TPath}/`, k> }
                    ? GetRouteMetadata<TChildRoute>[`/${TChildRoute['path']}`]
                    : never;
            }
            & HoistKeys<{
                [k in `children-${TChildRoute['path']}`]: TChildRoute extends { path: StringWithoutPrefix<'children-', k> }
                    ? AddKeysPrefix<`/${TPath}`, GetChildrenRouteMetadata<TChildRoute>>
                    : never
            }>
        : never
    : never;

type GetParametersFromPath<T> = T extends `${string}/:${infer Rest}`
    ? Rest extends `${infer Param}/${infer SubRest}` ? Param | GetParametersFromPath<`/${SubRest}`> : Rest
    : never;
type AddParametersMetadata<T> = {
    [K in keyof T]: Pretty<T[K] & {
        parameters: {
            [KK in GetParametersFromPath<K>]: string | number;
        };
    }>
};

type Trim<T extends string> = T extends `${infer S}/` ? S : T;
type RemoveDoubleSlashes<T extends string> = T extends `${infer S}//${infer Rest}`
    ? `${S}${RemoveDoubleSlashes<`/${Rest}`>}`
    : T;
type CleanPathsMetadata<T> = {
    [K in keyof T as K extends string ? Trim<RemoveDoubleSlashes<K>> : never]: T[K]
};

type RemoveUnknownComponents<T> = {
    [K in keyof T as T[K] extends { component: infer TComponent }
        ? unknown extends TComponent
            ? never
            : K
        : never]: T[K]
};

interface CoreRouteBase<TPath extends string = string, TComponent = unknown> {
    // TODO path should be optional as well (either path or matcher is required)
    path: TPath;
    component?: Type<TComponent>;
    matcher?: UrlMatcher;
}

interface CoreLazyRoute<
    TPath extends string = string,
    TComponent = unknown,
    TChildRoutes extends CoreRoutesArray = CoreRoutesArray
> extends CoreRouteBase<TPath, TComponent> {
    loadChildren: () => Promise<Constructor<CoreLazyRoutesModule<TChildRoutes>>>;
}

interface CoreEagerRoute<
    TPath extends string = string,
    TComponent = unknown,
    TChildRoutes extends CoreRoutesArray = CoreRoutesArray
> extends CoreRouteBase<TPath, TComponent> {
    children?: TChildRoutes;
}

type CoreRoutesArray<T extends CoreRoute = CoreRoute> = Array<T>;

export type CoreRoute<
    TPath extends string = string,
    TComponent = unknown,
    TChildRoutes extends CoreRoutesArray = GenericAny,
> =
    CoreLazyRoute<TPath, TComponent, TChildRoutes> | CoreEagerRoute<TPath, TComponent, TChildRoutes>;

export class CoreLazyRoutesModule<T extends CoreRoutesArray> {

    // This is declared for type inference, not actually available at runtime.
    // eslint-disable-next-line @typescript-eslint/naming-convention
    __routes?: T;

}

export type CoreRoutesMetadata<T extends CoreRoutesArray> =
    AddParametersMetadata<CleanPathsMetadata<RemoveUnknownComponents<GetRoutesMetadata<T>>>>;

/**
 * Define routes.
 *
 * @param routes Routes.
 * @returns Routes.
 */
export function defineRoutes<T>(routes: NarrowRoutes<T>): T {
    return routes as T;
}

/**
 * Configure routes so that they'll only match when a given condition is met.
 *
 * @param routes Routes.
 * @param condition Condition to determine if routes should be activated or not.
 * @returns Conditional routes.
 */
export function conditionalRoutes<T extends CoreRoutesArray>(routes: T, condition: () => boolean): T {
    return conditionalRoutesImpl(routes, condition) as T;
}
