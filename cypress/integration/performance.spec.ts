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

// eslint-disable-next-line jest/no-export
export {};

/**
 * @see https://web.dev/performance-scoring/
 */
describe('Performance', () => {

    beforeEach(() => {
        cy.visit('/').then(() => cy.wrap(Date.now()).as('start'));
    });

    /**
     * @see https://web.dev/first-contentful-paint/
     */
    it('[FCP] First Contentful Paint in less than 2 seconds', () => {
        cy.see('Welcome to the Moodle App!');

        cy.get<number>('@start').then(start => {
            expect(Date.now() - start).to.be.lessThan(2000);
        });
    });

    /**
     * @see https://web.dev/interactive/
     */
    it('[TTI] Time to Interactive is less than 3.8 seconds', () => {
        cy.press('Skip');
        cy.see('Connect to Moodle');

        cy.get<number>('@start').then(start => {
            expect(Date.now() - start).to.be.lessThan(3800);
        });
    });

    /**
     * @see https://web.dev/lighthouse-total-blocking-time/
     */
    it('[TBT] Total Blocking Time is less than 300 milliseconds', () => {
        cy.see('Welcome to the Moodle App!').then(() => cy.wrap(Date.now()).as('FCP'));
        cy.press('Skip');
        cy.see('Connect to Moodle');

        cy.get<number>('@FCP').then(start => {
            expect(Date.now() - start).to.be.lessThan(300);
        });
    });

});
