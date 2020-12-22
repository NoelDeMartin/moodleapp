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
    press: (text: string): Cypress.Chainable<void> => cy.contains(text).click(),
    resetBrowser: Database.reset,
    see: (text: string): Cypress.Chainable<void> => cy.contains(text).should('be.visible'),
};

for (const command in customCommands) {
    Cypress.Commands.add(command, customCommands[command]);
}

export default customCommands;
