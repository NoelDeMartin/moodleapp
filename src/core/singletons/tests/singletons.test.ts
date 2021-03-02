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

import { mock } from '@/testing/utils';
import { makeSingleton, setSingletonsInjector } from '@singletons';

class UniverseService {

    private years = 0;

    get theMeaningOfLife(): number {
        return 42;
    }

    getTheMeaningOfLife(): number {
        return this.theMeaningOfLife;
    }

    addYears(years: number): number {
        this.years += years;

        return this.years;
    }

}

const Universe = makeSingleton(UniverseService);

describe('Singletons', () => {

    beforeEach(() => {
        setSingletonsInjector(mock({ get: serviceClass => new serviceClass() }));
    });

    it('works using static instance', () => {
        expect(Universe.instance.getTheMeaningOfLife()).toBe(42);
    });

    it('works using magic methods', () => {
        expect(Universe.getTheMeaningOfLife()).toBe(42);
    });

    it('works using magic attributes', () => {
        expect(Universe.theMeaningOfLife).toBe(42);
    });

    it('magic accessors use the same instance', () => {
        expect(Universe.addYears(1)).toBe(1);
        expect(Universe.instance.addYears(1)).toBe(2);
        expect(Universe.addYears(1)).toBe(3);
        expect(Universe.instance.addYears(2)).toBe(5);
    });

});
