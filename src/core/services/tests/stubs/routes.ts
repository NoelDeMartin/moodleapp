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

/* eslint-disable padded-blocks */
/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */

import { CoreLazyRoutesModule, defineRoutes } from '@services/router';

/**
 * Define complex routes stub.
 *
 * @returns Routes and components.
 */
export function defineComplexRoutesStub() {
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
