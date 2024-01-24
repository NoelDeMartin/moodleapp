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

import {
    CoreDatabaseBase,
    CoreDatabaseColumnType,
    CoreDatabaseParam,
    CoreDatabaseRecord,
    CoreDatabaseValue,
} from '@classes/database/database';
import { Sqlite3Worker1Promiser } from '@sqlite.org/sqlite-wasm';

/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable max-len */

/**
 * Database implementation for native devices.
 */
export class CoreBrowserDatabase extends CoreDatabaseBase {

    private promiser: Sqlite3Worker1Promiser;

    constructor(promiser: Sqlite3Worker1Promiser) {
        super();

        this.promiser = promiser;
    }

    /**
     * @inheritdoc
     */
    async execute<T extends unknown[] = unknown[]>(sql: string, params?: CoreDatabaseParam[] | undefined): Promise<T> {
        type TItem = T extends Array<infer TItem> ? TItem : never;
        const rows = [] as TItem[];

        await this.promiser('exec', {
            sql,
            bind: params,
            callback({ row, columnNames }) {
                if (!row) {
                    return;
                }

                rows.push(columnNames.reduce((record, column, index) => {
                    record[column] = row[index];

                    return record;
                }, {} as TItem));
            },
        });

        return rows as T;
    }

    addColumn(table: string, column: string, type: CoreDatabaseColumnType, constraints?: string | undefined): Promise<void> {
        throw new Error('Method not implemented.');
    }

    close(): Promise<void> {
        throw new Error('Method not implemented.');
    }

    countRecords(table: string, conditions?: CoreDatabaseRecord | undefined): Promise<number> {
        throw new Error('Method not implemented.');
    }

    deleteRecords(table: string, conditions?: CoreDatabaseRecord | undefined): Promise<number> {
        throw new Error('Method not implemented.');
    }

    dropTable(name: string): Promise<void> {
        throw new Error('Method not implemented.');
    }

    getAllRecords<T = unknown>(table: string): Promise<T[]> {
        throw new Error('Method not implemented.');
    }

    getFieldSql(sql: string, params?: CoreDatabaseParam[] | undefined): Promise<CoreDatabaseValue> {
        throw new Error('Method not implemented.');
    }

    getRecord<T = unknown>(table: string, conditions?: CoreDatabaseRecord | undefined, fields?: string | undefined): Promise<T> {
        throw new Error('Method not implemented.');
    }

    getRecords<T = unknown>(table: string, conditions?: CoreDatabaseRecord | undefined, sort?: string | undefined, fields?: string | undefined, limitFrom?: number | undefined, limitNum?: number | undefined): Promise<T[]> {
        throw new Error('Method not implemented.');
    }

    getRecordsSelect<T = unknown>(table: string, select?: string | undefined, params?: CoreDatabaseParam[] | undefined, sort?: string | undefined, fields?: string | undefined, limitFrom?: number | undefined, limitNum?: number | undefined): Promise<T[]> {
        throw new Error('Method not implemented.');
    }

    insertRecord(table: string, data: CoreDatabaseRecord): Promise<number> {
        throw new Error('Method not implemented.');
    }

    migrateTable(oldTable: string, newTable: string, mapCallback?: ((record: CoreDatabaseRecord) => CoreDatabaseRecord) | undefined): Promise<void> {
        throw new Error('Method not implemented.');
    }

    recordExists(table: string, conditions?: CoreDatabaseRecord | undefined): Promise<void> {
        throw new Error('Method not implemented.');
    }

    tableExists(name: string): Promise<void> {
        throw new Error('Method not implemented.');
    }

    updateRecords(table: string, data: CoreDatabaseRecord, conditions?: CoreDatabaseRecord | undefined): Promise<number> {
        throw new Error('Method not implemented.');
    }

    updateRecordsWhere(table: string, data: CoreDatabaseRecord, where?: string | undefined, whereParams?: CoreDatabaseParam[] | undefined): Promise<number> {
        throw new Error('Method not implemented.');
    }

}
