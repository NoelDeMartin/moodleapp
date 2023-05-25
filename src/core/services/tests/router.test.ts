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

/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable padded-blocks */

import { expectTrue, mockSingleton, sameTypes } from '@/testing/utils';
import { CoreNavigator } from '@services/navigator';
import { CoreLazyRoutesModule, CoreRouter, CoreRoutesMetadata, defineRoutes } from '@services/router';
import { defineComplexRoutesStub } from '@services/tests/stubs/routes';

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
                parameters: {};
            };
            '/bar': {
                component: typeof B;
                parameters: {};
            };
        };
        type TActual = CoreRoutesMetadata<typeof routes>;

        expectTrue(sameTypes<TExpected, TActual>());
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
                parameters: {};
            };
            '/foo/bar': {
                component: typeof B;
                parameters: {};
            };
        };
        type TActual = CoreRoutesMetadata<typeof routes>;

        expectTrue(sameTypes<TExpected, TActual>());

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
                parameters: {};
            };
            '/foo/bar': {
                component: typeof B;
                parameters: {};
            };
        };
        type TActual = CoreRoutesMetadata<typeof routes>;

        expectTrue(sameTypes<TExpected, TActual>());

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
                parameters: {};
            };
            '/foo/bar': {
                component: typeof A;
                parameters: {};
            };
        };
        type TActual = CoreRoutesMetadata<typeof routes>;

        expectTrue(sameTypes<TExpected, TActual>());

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
                parameters: {};
            };
            '/foo/bar': {
                component: typeof B;
                parameters: {};
            };
        };
        type TActual = CoreRoutesMetadata<typeof routes>;

        expectTrue(sameTypes<TExpected, TActual>());

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
                parameters: {};
            };
            '/foo/baz': {
                component: typeof B;
                parameters: {};
            };
            '/foo/qux': {
                component: typeof C;
                parameters: {};
            };
        };
        type TActual = CoreRoutesMetadata<typeof routes>;

        expectTrue(sameTypes<TExpected, TActual>());

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
                parameters: {
                    id: number | string;
                    subId: number | string;
                };
            };
        };
        type TActual = CoreRoutesMetadata<typeof routes>;

        expectTrue(sameTypes<TExpected, TActual>());

    });

    it('defines complex routes', () => {
        const {
            routes,
            components: { A, B, C, D, E, F, G, H },
        } = defineComplexRoutesStub();

        type TExpected = {
            '/foo': {
                component: typeof A;
                parameters: {};
            };
            '/foo/bar': {
                component: typeof B;
                parameters: {};
            };
            '/foo/baz': {
                component: typeof C;
                parameters: {};
            };
            '/foo/qux': {
                component: typeof D;
                parameters: {};
            };
            '/foo/:id': {
                component: typeof E;
                parameters: {
                    id: string | number;
                };
            };
            '/foo/:id/quux': {
                component: typeof F;
                parameters: {
                    id: string | number;
                };
            };
            '/foo/:id/corge': {
                component: typeof G;
                parameters: {
                    id: string | number;
                };
            };
            '/foo/:id/:subId': {
                component: typeof H;
                parameters: {
                    id: string | number;
                    subId: string | number;
                };
            };
        };
        type TActual = CoreRoutesMetadata<typeof routes>;

        expectTrue(sameTypes<TExpected, TActual>());

    });

    it('accepts route arguments', async () => {
        const mockNavigator = mockSingleton(CoreNavigator, { navigateToSitePath: jest.fn(() => Promise.resolve(true)) });
        const badgeHash = '123456';

        await CoreRouter.navigateToSitePath('/badges/:badgeHash', { badgeHash });

        expect(mockNavigator.navigateToSitePath).toHaveBeenCalledWith(`/badges/${badgeHash}`, {});
    });

});
