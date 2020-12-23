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

import Database from './utils/Database';
import Interceptor from './utils/Interceptor';

const customCommands = {
    dontSee: (text: string): Cypress.Chainable<void> => cy.contains(text).should('not.exist'),
    interceptSiteRequests: Interceptor.interceptSiteRequests,

    // @todo bypass login with the UI
    // @see https://docs.cypress.io/guides/getting-started/testing-your-app.html#Bypassing-your-UI
    login(): void {
        const siteUrl = 'https://campus.example';

        // Prepare fixtures.
        cy.interceptSiteRequests(siteUrl);

        // Skip onboarding.
        cy.see('core.login.onboarding');
        cy.press('core.skip');
        cy.dontSee('core.login.onboarding');

        // Introduce site url.
        cy.see('core.login.connecttomoodle');
        cy.get('[placeholder="core.login.siteaddressplaceholder"]').type(siteUrl);
        cy.press('core.login.yourenteredsite');

        // Introduce user credentials.
        cy.see('core.login.login');
        cy.get('[placeholder="core.login.username"]').type('student', { force: true });
        cy.get('[placeholder="core.login.password"]').type('secret', { force: true });
        cy.press('core.login.loginbutton');

        // See home.
        cy.see('You are currently using the demo student account of Barbara Gardner');
    },

    press: (text: string): Cypress.Chainable<void> => cy.contains(text).click(),
    resetBrowser: Database.reset,
    see: (text: string): Cypress.Chainable<void> => cy.contains(text).should('be.visible'),
};

for (const command in customCommands) {
    Cypress.Commands.add(command, customCommands[command]);
}

export default customCommands;
