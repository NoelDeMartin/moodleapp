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

async function dropTable(transaction: DbTransaction, table: string): Promise<void> {
    table = JSON.stringify(table);

    return new Promise((resolve, reject) => transaction.executeSql(`DROP TABLE ${table}`, [], resolve, reject));
}

async function dropAllTables(transaction: DbTransaction) {
    return new Promise((resolve, reject) => {
        transaction.executeSql(
            `
                SELECT *
                FROM sqlite_master
                WHERE
                    name NOT LIKE 'sqlite\\_%' escape '\\' AND
                    name NOT LIKE '\\_%' escape '\\'
            `,
            [],
            (transaction, result) =>
                Promise
                    .all([...result.rows].map(table => dropTable(transaction, table.name)))
                    .then(resolve, reject),
            reject,
        );
    });
}

async function emptyDatabase(database: SQLiteObject): Promise<void> {
    return new Promise((resolve, reject) => {
        database.transaction(transaction => dropAllTables(transaction).then(resolve, reject));
    });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function emptySiteDatabase(window: any, siteId: string) {
    const database = window.openDatabase(`Site-${siteId}`, '1.0', `Site-${siteId}`, 500 * 1024 * 1024);

    return emptyDatabase(database);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function emptyAllDatabases(window: any): Promise<void> {
    const database: SQLiteObject = window.openDatabase('MoodleMobile', '1.0', 'MoodleMobile', 500 * 1024 * 1024);

    return new Promise((resolve, reject) => {
        database.transaction(transaction => {
            transaction.executeSql(
                'SELECT * FROM sites_2',
                [],
                (_, result) =>
                    Promise
                        .all([...result.rows].map(site => emptySiteDatabase(window, site.id)))
                        .then(() => emptyDatabase(database))
                        .then(resolve, reject),
                () => emptyDatabase(database).then(resolve, reject),
            );
        });
    });
}

export default class Database {

    static reset(): void {
        cy.window().then(emptyAllDatabases);
    }

}
