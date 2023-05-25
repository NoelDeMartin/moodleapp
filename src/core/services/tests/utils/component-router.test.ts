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

import { expectTrue, sameTypes } from '@/testing/utils';
import { CoreRoutesMetadata } from '@services/router';
import { defineComplexRoutesStub } from '@services/tests/stubs/routes';
import { GetComponentRouteParameters, GetRelativeComponentRoutePaths } from '@services/utils/component-router';

describe('Component Router', () => {

    it('gets relative component route paths', () => {
        const {
            routes,
            components: { E },
        } = defineComplexRoutesStub();

        type Routes = CoreRoutesMetadata<typeof routes>;

        type TExpected = './quux' | './corge' | './:subId';
        type TActual = GetRelativeComponentRoutePaths<typeof E, Routes>;

        expectTrue(sameTypes<TExpected, TActual>());
    });

    it('gets component parameters', () => {
        const {
            routes,
            components: { H },
        } = defineComplexRoutesStub();

        type Routes = CoreRoutesMetadata<typeof routes>;

        type TExpected = {
            id: string | number;
            subId: string | number;
        };
        type TActual = GetComponentRouteParameters<typeof H, Routes>;

        expectTrue(sameTypes<TExpected, TActual>());
    });

});
