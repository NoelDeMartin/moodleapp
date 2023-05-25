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

import { CoreNavigationOptions, CoreNavigator } from '@services/navigator';
import { GetParametersFromPath } from '@services/router';
import { AppRoutesMetadata } from '@/app/app-routing.module';
import { Cast } from '@/core/utils/types';

type GetComponentRoutePaths<TComponent, TRoutes> = {
    [K in keyof TRoutes]: TRoutes[K] extends { component: TComponent }
        ? Cast<K, string>
        : never
}[keyof TRoutes];

type GetRelativeRoutePaths<TPath extends string, TRoutes> = {
    [K in keyof TRoutes]: K extends `${TPath}/${infer Rest}`
        ? `./${Rest}`
        : never;
}[keyof TRoutes];

export type GetComponentRouteParameters<TComponent, TRoutes> = {
    [K in keyof TRoutes]: TRoutes[K] extends { component: TComponent }
        ? TRoutes[K] extends { parameters: infer TParameters } ? TParameters : never
        : never
}[keyof TRoutes];

export type GetRelativeComponentRoutePaths<TComponent, TRoutes> =
    GetRelativeRoutePaths<GetComponentRoutePaths<TComponent, TRoutes>, TRoutes>;

export class CoreComponentRouter<TComponent> {

    parameters: GetComponentRouteParameters<TComponent, AppRoutesMetadata>;

    constructor() {
        // TODO implement reading parameters from route.
        this.parameters = {} as GetComponentRouteParameters<TComponent, AppRoutesMetadata>;
    }

    /**
     * Navigate to a relative path.
     *
     * @param path Route relative path.
     * @param parameters Route parameters.
     * @param options Navigation and site options.
     * @returns Whether navigation suceeded.
     */
    async navigate<
        T extends GetRelativeComponentRoutePaths<TComponent, AppRoutesMetadata> =
        GetRelativeComponentRoutePaths<TComponent, AppRoutesMetadata>
    >(
        path: T,
        parameters: { [K in GetParametersFromPath<T>]: string | number; },
        options?: CoreNavigationOptions,
    ): Promise<boolean> {
        const renderedPath = Object.entries(parameters).reduce(
            (path, [key, value]) => path.replace(`:${key}`, String(value)),
            path,
        );

        return CoreNavigator.navigate(renderedPath, options);
    }

}
