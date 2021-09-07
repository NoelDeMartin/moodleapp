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

export interface PerformanceTestOptions {
    runs: number;
    maxTime: number;
    includesBoot?: boolean;
    setUp?: () => unknown;
    tearDown?: () => unknown;
}

export default {

    measureBootOverhead(): void {
        let start;

        cy.then(() => start = Date.now());
        cy.visit('/assets/cypress.html');
        cy.see('Hello, Cypress!').then(() => cy.wrap(Date.now() - start).as('bootOverhead'));
    },

    measurePerformance(options: PerformanceTestOptions, run: () => unknown): void {
        const times: number[] = [];
        let start: number;

        for (let i = 0; i < options.runs; i++) {
            cy.then(() => Cypress.log({
                name: 'Performance',
                message: `Starting run #${i + 1}`,
            }));

            options.setUp?.call(null);
            cy.then(() => start = Date.now());
            run();
            cy.then(() => {
                const runTime = Date.now() - start;

                times.push(runTime);

                Cypress.log({
                    name: 'Performance',
                    message: `Run #${i + 1} time: ${runTime}ms`,
                });
            });
            options.tearDown?.call(null);
        }

        cy.get<number>('@bootOverhead').then(bootOverhead => {
            const averageTime = times.reduce((a, b) => a + b) / times.length;
            const expectedTime = options.maxTime + (options.includesBoot ? bootOverhead : 0);

            expect(averageTime).to.be.lessThan(expectedTime);
        });
    },

};
