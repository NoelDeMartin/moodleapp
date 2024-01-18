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

/**
 * Database connection.
 */
export abstract class CoreDatabase {

    /**
     * Execute SQL statement.
     *
     * @param sql SQL statement.
     * @param params SQL parameters.
     * @returns Statement result.
     */
    abstract execute<T = unknown>(sql: string, params?: CoreDatabaseParam[]): Promise<T>;

    // These are only temporary placeholders to help with the migration.
    /* eslint-disable max-len */
    abstract addColumn(table: string, column: string, type: CoreDatabaseColumnType, constraints?: string): Promise<void>;
    abstract close(): Promise<void>;
    abstract countRecords(table: string, conditions?: CoreDatabaseRecord): Promise<number>;
    abstract createTableFromSchema(table: CoreDatabaseTableSchema): Promise<void>;
    abstract createTablesFromSchema(tables: CoreDatabaseTableSchema[]): Promise<void>;
    abstract deleteRecords(table: string, conditions?: CoreDatabaseRecord): Promise<number>;
    abstract dropTable(name: string): Promise<void>;
    abstract getAllRecords<T = unknown>(table: string): Promise<T[]>;
    abstract getFieldSql(sql: string, params?: CoreDatabaseParam[]): Promise<CoreDatabaseValue>;
    abstract getRecord<T = unknown>(table: string, conditions?: CoreDatabaseRecord, fields?: string): Promise<T>;
    abstract getRecords<T = unknown>(table: string, conditions?: CoreDatabaseRecord, sort?: string, fields?: string, limitFrom?: number, limitNum?: number): Promise<T[]>;
    abstract getRecordsSelect<T = unknown>(table: string, select?: string, params?: CoreDatabaseParam[], sort?: string, fields?: string, limitFrom?: number, limitNum?: number): Promise<T[]>;
    abstract insertRecord(table: string, data: CoreDatabaseRecord): Promise<number>;
    abstract migrateTable(oldTable: string, newTable: string, mapCallback?: (record: CoreDatabaseRecord) => CoreDatabaseRecord): Promise<void>;
    abstract recordExists(table: string, conditions?: CoreDatabaseRecord): Promise<void>;
    abstract tableExists(name: string): Promise<void>;
    abstract updateRecords(table: string, data: CoreDatabaseRecord, conditions?: CoreDatabaseRecord): Promise<number>;
    abstract updateRecordsWhere(table: string, data: CoreDatabaseRecord, where?: string, whereParams?: CoreDatabaseParam[]): Promise<number>;
    /* eslint-enable max-len */

}

/**
 * Schema of a table.
 */
export interface CoreDatabaseTableSchema {
    /**
     * The table name.
     */
    name: string;

    /**
     * The columns to create in the table.
     */
    columns: CoreDatabaseColumnSchema[];

    /**
     * Names of columns that are primary key. Use it for compound primary keys.
     */
    primaryKeys?: string[];

    /**
     * List of sets of unique columns. E.g: [['section', 'title'], ['author', 'title']].
     */
    uniqueKeys?: string[][];

    /**
     * List of foreign keys.
     */
    foreignKeys?: CoreDatabaseForeignKeySchema[];

    /**
     * Check constraint for the table.
     */
    tableCheck?: string;
}

/**
 * Schema of a column.
 */
export interface CoreDatabaseColumnSchema {
    /**
     * Column's name.
     */
    name: string;

    /**
     * Column's type.
     */
    type?: CoreDatabaseColumnType;

    /**
     * Whether the column is a primary key. Use it only if primary key is a single column.
     */
    primaryKey?: boolean;

    /**
     * Whether it should be autoincremented. Only if primaryKey is true.
     */
    autoIncrement?: boolean;

    /**
     * True if column shouldn't be null.
     */
    notNull?: boolean;

    /**
     * WWhether the column is unique.
     */
    unique?: boolean;

    /**
     * Check constraint for the column.
     */
    check?: string;

    /**
     * Default value for the column.
     */
    default?: string;
}

/**
 * Schema of a foreign key.
 */
export interface CoreDatabaseForeignKeySchema {
    /**
     * Columns to include in this foreign key.
     */
    columns: string[];

    /**
     * The external table referenced by this key.
     */
    table: string;

    /**
     * List of referenced columns from the referenced table.
     */
    foreignColumns?: string[];

    /**
     * Text with the actions to apply to the foreign key.
     */
    actions?: string;
}

export type CoreDatabaseColumnType = 'INTEGER' | 'REAL' | 'TEXT' | 'BLOB';
export type CoreDatabaseParam = string | number;
export type CoreDatabaseValue = string | number | undefined | null;
export type CoreDatabaseRecord = Record<string, CoreDatabaseValue>;
