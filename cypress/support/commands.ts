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

import { DbTransaction, SQLiteObject } from '@ionic-native/sqlite/ngx';

async function dropTables(transaction: DbTransaction, tables: string[]): Promise<void> {
    await Promise.all(tables.map(table => {
        table = JSON.stringify(table);

        return new Promise((resolve, reject) => transaction.executeSql(`DROP TABLE ${table}`, [], resolve, reject));
    }));
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function emptyDatabase(window: any): Promise<void> {
    const database: SQLiteObject = window.openDatabase('MoodleMobile', '1.0', 'MoodleMobile', 500 * 1024 * 1024);

    return new Promise(
        (resolve, reject) =>
            database.transaction(transaction => transaction.executeSql(
                `
                    SELECT *
                    FROM sqlite_master
                    WHERE
                        name NOT LIKE 'sqlite\\_%' escape '\\' AND
                        name NOT LIKE '\\_%' escape '\\'
                `,
                [],
                (transaction, result) => dropTables(transaction, [...result.rows].map(r => r.name)).then(resolve, reject),
            )),
    );
}

const customCommands = {
    resetBrowser: (): Cypress.Chainable<void> => cy.window().then(emptyDatabase),
    see: (text: string): Cypress.Chainable<void> => cy.contains(text).should('be.visible'),
};

for (const command in customCommands) {
    Cypress.Commands.add(command, customCommands[command]);
}


export default customCommands;
