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

import { Equals, Expect, expectTypesEqual, mockSingleton } from '@/testing/utils';
import { CoreNavigator } from '@services/navigator';
import {
    CoreLazyRoutesModule,
    CoreRoutesDefinition,
    CoreRouter,
    defineRoutes,
    GetRelativeRoutes,
    GetComponentParams,
} from '@services/router';

/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable padded-blocks */
/* eslint-disable @typescript-eslint/naming-convention */

describe('Router', () => {

    it('defines eager routes', () => {
        class A { a = ''; }
        class B { b = ''; }

        const routes = defineRoutes([
            {
                path: 'foo',
                component: A,
            },
            {
                path: 'bar',
                component: B,
            },
        ]);

        type TExpected = {
            '/foo': {
                component: typeof A;
                params: {};
            };
            '/bar': {
                component: typeof B;
                params: {};
            };
        };
        type TActual = CoreRoutesDefinition<typeof routes>;

        expectTypesEqual<Expect<Equals<TExpected, TActual>>>();
    });

    it('defines eager routes with children', () => {
        class A { a = ''; }
        class B { b = ''; }

        const routes = defineRoutes([
            {
                path: 'foo',
                component: A,
                children: [
                    {
                        path: 'bar',
                        component: B,
                    },
                ],
            },
        ]);

        type TExpected = {
            '/foo': {
                component: typeof A;
                params: {};
            };
            '/foo/bar': {
                component: typeof B;
                params: {};
            };
        };
        type TActual = CoreRoutesDefinition<typeof routes>;

        expectTypesEqual<Expect<Equals<TExpected, TActual>>>();
    });

    it('defines eager routes with index in children', () => {
        class A { a = ''; }
        class B { b = ''; }

        const routes = defineRoutes([
            {
                path: 'foo',
                children: [
                    {
                        path: '',
                        component: A,
                    },
                    {
                        path: 'bar',
                        component: B,
                    },
                ],
            },
        ]);

        type TExpected = {
            '/foo': {
                component: typeof A;
                params: {};
            };
            '/foo/bar': {
                component: typeof B;
                params: {};
            };
        };
        type TActual = CoreRoutesDefinition<typeof routes>;

        expectTypesEqual<Expect<Equals<TExpected, TActual>>>();
    });

    it('defines lazy routes', () => {
        class A { a = ''; }
        class B { b = ''; }

        const childRoutes = defineRoutes([
            {
                path: 'bar',
                component: A,
            },
        ]);
        class ChildModule extends CoreLazyRoutesModule<typeof childRoutes> {}

        const routes = defineRoutes([
            {
                path: 'foo',
                component: B,
                loadChildren: () => Promise.resolve(ChildModule),
            },
        ]);

        type TExpected = {
            '/foo': {
                component: typeof B;
                params: {};
            };
            '/foo/bar': {
                component: typeof A;
                params: {};
            };
        };
        type TActual = CoreRoutesDefinition<typeof routes>;

        expectTypesEqual<Expect<Equals<TExpected, TActual>>>();
    });

    it('defines lazy routes with index in children', () => {
        class A { a = ''; }
        class B { b = ''; }

        const childRoutes = defineRoutes([
            {
                path: '',
                component: A,
            },
            {
                path: 'bar',
                component: B,
            },
        ]);
        class ChildModule extends CoreLazyRoutesModule<typeof childRoutes> {}

        const routes = defineRoutes([
            {
                path: 'foo',
                loadChildren: () => Promise.resolve(ChildModule),
            },
        ]);

        type TExpected = {
            '/foo': {
                component: typeof A;
                params: {};
            };
            '/foo/bar': {
                component: typeof B;
                params: {};
            };
        };
        type TActual = CoreRoutesDefinition<typeof routes>;

        expectTypesEqual<Expect<Equals<TExpected, TActual>>>();
    });

    it('defines mixed routes', () => {
        class A { a = ''; }
        class B { b = ''; }
        class C { c = ''; }

        const childRoutes = defineRoutes([
            {
                path: '',
                children: [
                    {
                        path: 'bar',
                        component: A,
                    },
                ],
            },
            {
                path: 'baz',
                children: [
                    {
                        path: '',
                        component: B,
                    },
                ],
            },
            {
                path: 'qux',
                component: C,
            },
        ]);
        class ChildModule extends CoreLazyRoutesModule<typeof childRoutes> {}

        const routes = defineRoutes([
            {
                path: 'foo',
                loadChildren: () => Promise.resolve(ChildModule),
            },
        ]);

        type TExpected = {
            '/foo/bar': {
                component: typeof A;
                params: {};
            };
            '/foo/baz': {
                component: typeof B;
                params: {};
            };
            '/foo/qux': {
                component: typeof C;
                params: {};
            };
        };
        type TActual = CoreRoutesDefinition<typeof routes>;

        expectTypesEqual<Expect<Equals<TExpected, TActual>>>();
    });

    it('defines routes with parameters', () => {
        class A { a = ''; }

        const routes = defineRoutes([
            {
                path: 'foo/:id/bar/:subId',
                component: A,
            },
        ]);

        type TExpected = {
            '/foo/:id/bar/:subId': {
                component: typeof A;
                params: {
                    id: number | string;
                    subId: number | string;
                };
            };
        };
        type TActual = CoreRoutesDefinition<typeof routes>;

        expectTypesEqual<Expect<Equals<TExpected, TActual>>>();
    });

    it('defines complex routes', () => {
        const {
            routes,
            components: { A, B, C, D, E, F, G, H },
        } = defineComplexRoutes();

        type TExpected = {
            '/foo': {
                component: typeof A;
                params: {};
            };
            '/foo/bar': {
                component: typeof B;
                params: {};
            };
            '/foo/baz': {
                component: typeof C;
                params: {};
            };
            '/foo/qux': {
                component: typeof D;
                params: {};
            };
            '/foo/:id': {
                component: typeof E;
                params: {
                    id: string | number;
                };
            };
            '/foo/:id/quux': {
                component: typeof F;
                params: {
                    id: string | number;
                };
            };
            '/foo/:id/corge': {
                component: typeof G;
                params: {
                    id: string | number;
                };
            };
            '/foo/:id/:subId': {
                component: typeof H;
                params: {
                    id: string | number;
                    subId: string | number;
                };
            };
        };
        type TActual = CoreRoutesDefinition<typeof routes>;

        expectTypesEqual<Expect<Equals<TExpected, TActual>>>();
    });

    it('gets relative component routes', () => {
        const {
            routes,
            components: { E },
        } = defineComplexRoutes();

        type Routes = CoreRoutesDefinition<typeof routes>;

        type TExpected = './quux' | './corge' | './:subId';
        type TActual = GetRelativeRoutes<typeof E, Routes>;

        expectTypesEqual<Expect<Equals<TExpected, TActual>>>();
    });

    it('gets component parameters', () => {
        const {
            routes,
            components: { H },
        } = defineComplexRoutes();

        type Routes = CoreRoutesDefinition<typeof routes>;

        type TExpected = {
            id: string | number;
            subId: string | number;
        };
        type TActual = GetComponentParams<typeof H, Routes>;

        expectTypesEqual<Expect<Equals<TExpected, TActual>>>();
    });

    it('accepts route arguments', async () => {
        const mockNavigator = mockSingleton(CoreNavigator, { navigateToSitePath: jest.fn(() => Promise.resolve(true)) });
        const badgeHash = '123456';

        await CoreRouter.navigateToSitePath('/badges/:badgeHash', { badgeHash });

        expect(mockNavigator.navigateToSitePath).toHaveBeenCalledWith(`/badges/${badgeHash}`, {});
    });

});

/**
 * Define stub complex routes.
 *
 * @returns Routes and components.
 */
function defineComplexRoutes() {
    class A { a = ''; }
    class B { b = ''; }
    class C { c = ''; }
    class D { d = ''; }
    class E { e = ''; }
    class F { f = ''; }
    class G { g = ''; }
    class H { h = ''; }

    const children = defineRoutes([
        {
            path: '',
            component: A,
            children: [
                {
                    path: 'bar',
                    component: B,
                },
            ],
        },
        {
            path: 'baz',
            component: C,
        },
        {
            path: 'qux',
            component: D,
        },
        {
            path: ':id',
            children: [
                {
                    path: '',
                    component: E,
                },
                {
                    path: 'quux',
                    component: F,
                },
                {
                    path: 'corge',
                    component: G,
                },
                {
                    path: ':subId',
                    component: H,
                },
            ],
        },
    ]);
    class ChildModule extends CoreLazyRoutesModule<typeof children> {}

    const routes = defineRoutes([
        {
            path: 'foo',
            loadChildren: () => Promise.resolve(ChildModule),
        },
    ]);

    return {
        routes,
        components: { A, B, C, D, E, F, G, H },
    };
}
