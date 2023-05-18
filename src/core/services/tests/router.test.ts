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

import { Equals, Expect, expectTypesEqual, mock } from '@/testing/utils';
import { Type } from '@angular/core';
import { CoreLazyRoutesModule, CoreRouteDefinition, defineRoute } from '@services/router';

describe('Router', () => {

    const component = mock<Type<unknown>>();

    it('defines eager routes', () => {
        const route = defineRoute({
            path: 'foo',
            component,
        });

        type TExpected = { '/foo': true };
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

        type TExpected = { '/foo/bar': true };
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
        ];
        class ChildModule extends CoreLazyRoutesModule<typeof children> {}

        const route = defineRoute({
            path: 'foo',
            loadChildren: () => Promise.resolve(ChildModule),
        });

        type TExpected = {
            '/foo': true;
            '/foo/bar': true;
            '/foo/baz': true;
        };
        type TActual = CoreRouteDefinition<typeof route>;

        expectTypesEqual<Expect<Equals<TExpected, TActual>>>();
    });

});
