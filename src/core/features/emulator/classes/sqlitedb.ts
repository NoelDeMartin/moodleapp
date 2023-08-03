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

import { SQLiteDB } from '@classes/sqlitedb';
import { DbTransaction, SQLiteObject } from '@ionic-native/sqlite/ngx';
import { CoreDB } from '@services/db';
import { CorePromisedValue } from '@classes/promised-value';
import {
    initializeMessage,
    isInitializedMessage,
    isCallResultMessage,
    callMethodMessage,
} from '@features/emulator/utils/worker-messages';

/**
 * Class to mock the interaction with the SQLite database.
 */
export class SQLiteDBMock extends SQLiteDB {

    /**
     * Create and open the database.
     *
     * @param name Database name.
     */
    constructor(public name: string) {
        super(name);
    }

    /**
     * Close the database.
     *
     * @returns Promise resolved when done.
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    close(): Promise<any> {
        // WebSQL databases aren't closed.
        // TODO this may be possible now
        return Promise.resolve();
    }

    /**
     * Drop all the data in the database.
     *
     * @returns Promise resolved when done.
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async emptyDatabase(): Promise<any> {
        // TODO this may not be necessary anymore (it should be possible to delete databases)
    }

    /**
     * Execute a SQL query.
     * IMPORTANT: Use this function only if you cannot use any of the other functions in this API. Please take into account that
     * these query will be run in SQLite (Mobile) and Web SQL (desktop), so your query should work in both environments.
     *
     * @param sql SQL query to execute.
     * @param params Query parameters.
     * @returns Promise resolved with the result.
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async execute(sql: string, params?: any[]): Promise<any> {
        // TODO replace implementation

        await this.ready();

        return new Promise((resolve, reject): void => {
            // With WebSQL, all queries must be run in a transaction.
            this.db?.transaction((tx) => {
                tx.executeSql(
                    sql,
                    params,
                    (_, results) => resolve(results),
                    (_, error) => reject(new Error(`SQL failed: ${sql}, reason: ${error?.message}`)),
                );
            });
        });
    }

    /**
     * Execute a set of SQL queries. This operation is atomic.
     * IMPORTANT: Use this function only if you cannot use any of the other functions in this API. Please take into account that
     * these query will be run in SQLite (Mobile) and Web SQL (desktop), so your query should work in both environments.
     *
     * @param sqlStatements SQL statements to execute.
     * @returns Promise resolved with the result.
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async executeBatch(sqlStatements: any[]): Promise<any> {
        // TODO replace implementation

        await this.ready();

        return new Promise((resolve, reject): void => {
            // Create a transaction to execute the queries.
            this.db?.transaction((tx) => {
                const promises: Promise<void>[] = [];

                // Execute all the queries. Each statement can be a string or an array.
                sqlStatements.forEach((statement) => {
                    promises.push(new Promise((resolve, reject): void => {
                        let query;
                        let params;

                        if (Array.isArray(statement)) {
                            query = statement[0];
                            params = statement[1];
                        } else {
                            query = statement;
                            params = null;
                        }

                        tx.executeSql(query, params, (_, results) => resolve(results), (_, error) => reject(error));
                    }));
                });

                // eslint-disable-next-line promise/catch-or-return
                Promise.all(promises).then(resolve, reject);
            });
        });
    }

    /**
     * Open the database. Only needed if it was closed before, a database is automatically opened when created.
     *
     * @returns Promise resolved when done.
     */
    open(): Promise<void> {
        // WebSQL databases can't closed, so the open method isn't needed.
        // TODO this may be possible now
        return Promise.resolve();
    }

    /**
     * @inheritdoc
     */
    protected async createDatabase(): Promise<SQLiteObject> {
        const worker = new Worker('./sqlitedb.worker', { type: 'module' });
        const operations: Record<string, CorePromisedValue> = {};
        const initialized = new CorePromisedValue<void>();
        let operationsCounter = 0;

        worker.onmessage = function (event: MessageEvent) {
            if (isInitializedMessage(event.data)) {
                initialized.resolve();

                return;
            }

            if (isCallResultMessage(event.data)) {
                if (!(event.data.id in operations)) {
                    return;
                }

                if (event.data.error) {
                    operations[event.data.id].reject(event.data.error as any);
                } else {
                    operations[event.data.id].resolve(event.data.success);
                }

                delete operations[event.data.id];

                return;
            }
        };

        worker.postMessage(initializeMessage(this.name, `${document.head.baseURI}/assets/lib/sqlite3/sqlite3.js`));

        await initialized;

        const db: Partial<SQLiteObject> = {
            async transaction(callback) {
                callback({
                    executeSql(sql, values, resolve, reject) {
                        const id = operationsCounter++;
                        const promisedResult = operations[id] = new CorePromisedValue<any>();

                        promisedResult
                            .then(result => resolve?.(null, {
                                rows: {
                                    item: (index: number): any => result[index],
                                },
                                rowsAffected: result.length,
                            }))
                            .catch(error => reject?.(null, error));

                        worker.postMessage(callMethodMessage(id, 'exec', [{
                            sql,
                            bind: values,
                            rowMode: 'array',
                        }]));
                    },
                } as DbTransaction);
            },
        };

        return db as unknown as SQLiteObject;
    }

    /**
     * @inheritdoc
     */
    protected getDatabaseSpies(db: SQLiteObject): Partial<SQLiteObject> {
        const dbName = this.name;

        return {
            transaction: (callback) => db.transaction((transaction) => {
                const transactionSpy: DbTransaction = {
                    executeSql(sql, params, success, error) {
                        const start = performance.now();

                        return transaction.executeSql(
                            sql,
                            params,
                            (...args) => {
                                CoreDB.logQuery({
                                    sql,
                                    params,
                                    duration: performance.now() - start,
                                    dbName,
                                });

                                return success?.(...args);
                            },
                            (...args) => {
                                CoreDB.logQuery({
                                    sql,
                                    params,
                                    error: args[0],
                                    duration: performance.now() - start,
                                    dbName,
                                });

                                return error?.(...args);
                            },
                        );
                    },
                };

                return callback(transactionSpy);
            }),
        };
    }

}
