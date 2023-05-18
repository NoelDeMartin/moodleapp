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

import { Equals, Expect, expectTypesEqual, mock, mockSingleton } from '@/testing/utils';
import { Type } from '@angular/core';
import { CoreNavigator } from '@services/navigator';
import { CoreLazyRoutesModule, CoreRouteDefinition, CoreRouter, defineRoute } from '@services/router';

/* eslint-disable @typescript-eslint/ban-types */

describe('Router', () => {

    const component = mock<Type<unknown>>();

    it('defines eager routes', () => {
        const route = defineRoute({
            path: 'foo',
            component,
        });

        type TExpected = { '/foo': {} };
        type TActual = CoreRouteDefinition<typeof route>;

        expectTypesEqual<Expect<Equals<TExpected, TActual>>>();
    });

    it('defines lazy routes', () => {
        const childRoute = defineRoute({
            path: 'bar',
            component,
        });
        class ChildModule extends CoreLazyRoutesModule<typeof childRoute> {}

        const route = defineRoute({
            path: 'foo',
            loadChildren: () => Promise.resolve(ChildModule),
        });

        type TExpected = { '/foo/bar': {} };
        type TActual = CoreRouteDefinition<typeof route>;

        expectTypesEqual<Expect<Equals<TExpected, TActual>>>();
    });

    it('defines lazy routes with multiple children', () => {
        const children = [
            defineRoute({
                path: '',
                component,
            }),
            defineRoute({
                path: 'bar',
                component,
            }),
            defineRoute({
                path: 'baz',
                component,
            }),
            defineRoute({
                path: ':id',
                component,
            }),
        ];
        class ChildModule extends CoreLazyRoutesModule<typeof children> {}

        const route = defineRoute({
            path: 'foo',
            loadChildren: () => Promise.resolve(ChildModule),
        });

        type TExpected = {
            '/foo': {};
            '/foo/bar': {};
            '/foo/baz': {};
            '/foo/:id': {
                id: string;
            };
        };
        type TActual = CoreRouteDefinition<typeof route>;

        expectTypesEqual<Expect<Equals<TExpected, TActual>>>();
    });

    it('accepts route arguments', async () => {
        const mockNavigator = mockSingleton(CoreNavigator, { navigateToSitePath: jest.fn(() => Promise.resolve(true)) });
        const badgeHash = '123456';

        await CoreRouter.navigateToSitePath('/badges/:badgeHash', { badgeHash });

        expect(mockNavigator.navigateToSitePath).toHaveBeenCalledWith(`/badges/${badgeHash}`, {});
    });

});
