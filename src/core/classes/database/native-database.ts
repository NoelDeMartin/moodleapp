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
    CoreDatabase,
    CoreDatabaseParam,
    CoreDatabaseValue,
    CoreDatabaseRecord,
    CoreDatabaseTableSchema,
    CoreDatabaseColumnType,
} from '@classes/database/database';

import { SQLiteDB } from '@classes/sqlitedb';

/**
 * Database implementation for native devices.
 */
export class CoreNativeDatabase extends CoreDatabase {

    private sqlite: SQLiteDB;

    constructor(sqlite: SQLiteDB) {
        super();

        this.sqlite = sqlite;
    }

    /**
     * @inheritdoc
     */
    execute<T = unknown>(sql: string, params?: CoreDatabaseParam[]): Promise<T> {
        return this.sqlite.execute(sql, params);
    }

    addColumn(table: string, column: string, type: CoreDatabaseColumnType, constraints?: string): Promise<void> {
        return this.sqlite.addColumn(table, column, type, constraints);
    }

    close(): Promise<void> {
        return this.sqlite.close();
    }

    countRecords(table: string, conditions?: CoreDatabaseRecord): Promise<number> {
        return this.sqlite.countRecords(table, conditions);
    }

    createTableFromSchema(table: CoreDatabaseTableSchema): Promise<void> {
        return this.sqlite.createTableFromSchema(table);
    }

    createTablesFromSchema(tables: CoreDatabaseTableSchema[]): Promise<void> {
        return this.sqlite.createTablesFromSchema(tables);
    }

    deleteRecords(table: string, conditions?: CoreDatabaseRecord): Promise<number> {
        return this.sqlite.deleteRecords(table, conditions);
    }

    dropTable(name: string): Promise<void> {
        return this.sqlite.dropTable(name);
    }

    getAllRecords<T = unknown>(table: string): Promise<T[]> {
        return this.sqlite.getAllRecords(table);
    }

    getFieldSql(sql: string, params?: CoreDatabaseParam[]): Promise<CoreDatabaseValue> {
        return this.sqlite.getFieldSql(sql, params);
    }

    getRecord<T = unknown>(table: string, conditions?: CoreDatabaseRecord, fields?: string): Promise<T> {
        return this.sqlite.getRecord(table, conditions, fields);
    }

    getRecords<T = unknown>(
        table: string,
        conditions?: CoreDatabaseRecord,
        sort?: string,
        fields?: string,
        limitFrom?: number,
        limitNum?: number,
    ): Promise<T[]> {
        return this.sqlite.getRecords(table, conditions, sort, fields, limitFrom, limitNum);
    }

    getRecordsSelect<T = unknown>(
        table: string,
        select?: string,
        params?: CoreDatabaseParam[],
        sort?: string,
        fields?: string,
        limitFrom?: number,
        limitNum?: number,
    ): Promise<T[]> {
        return this.sqlite.getRecordsSelect(table, select, params, sort, fields, limitFrom, limitNum);
    }

    insertRecord(table: string, data: CoreDatabaseRecord): Promise<number> {
        return this.sqlite.insertRecord(table, data);
    }

    migrateTable(
        oldTable: string,
        newTable: string,
        mapCallback?: (record: CoreDatabaseRecord) => CoreDatabaseRecord,
    ): Promise<void> {
        return this.sqlite.migrateTable(oldTable, newTable, mapCallback);
    }

    recordExists(table: string, conditions?: CoreDatabaseRecord): Promise<void> {
        return this.sqlite.recordExists(table, conditions);
    }

    tableExists(name: string): Promise<void> {
        return this.sqlite.tableExists(name);
    }

    updateRecords(table: string, data: CoreDatabaseRecord, conditions?: CoreDatabaseRecord): Promise<number> {
        return this.sqlite.updateRecords(table, data, conditions);
    }

    updateRecordsWhere(
        table: string,
        data: CoreDatabaseRecord,
        where?: string,
        whereParams?: CoreDatabaseParam[],
    ): Promise<number> {
        return this.sqlite.updateRecordsWhere(table, data, where, whereParams);
    }

}
