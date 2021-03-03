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

describe('Navigation', () => {

    beforeEach(() => {
        cy.visit('/');
        cy.login();
    });

    it('changes home tabs', () => {
        cy.press('Site home', { force: true });
        cy.see('Mount Orange School provides high quality education for students aged from 8 to 18 years');
        cy.contains('ion-slide', 'Site home').should('have.attr', 'aria-selected', 'true');

        cy.press('Dashboard', { force: true });
        cy.see('You are currently using the demo student account of Barbara Gardner');
        cy.contains('ion-slide', 'Dashboard').should('have.attr', 'aria-selected', 'true');
    });

});
