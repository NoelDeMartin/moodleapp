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

import { Injectable } from '@angular/core';

import { CoreApp } from '@services/app';
import { CoreSingletonProxy, makeSingleton } from '@singletons';
import { SQLiteDB } from '@classes/sqlitedb';

import { CoreSite } from '@classes/site';

import { APP_SCHEMA, CoreStorageRecord, TABLE_NAME } from './database/storage';

/**
 * Service to store data using key-value pairs.
 *
 * The data can be scoped to a single site using CoreStorage.forSite(site), and it will be automatically cleared
 * when the site is deleted.
 *
 * For tabular data, use CoreAppProvider.getDB() or CoreSite.getDb().
 */
@Injectable({ providedIn: 'root' })
export class CoreStorageService {

    // Variables for DB.
    resolveDB!: (db: SQLiteDB) => void;
    protected db: Promise<SQLiteDB>;

    constructor() {
        this.db = new Promise(resolve => this.resolveDB = resolve);
    }

    /**
     * Initialize database.
     */
    async initializeDatabase(): Promise<void> {
        try {
            await CoreApp.createTablesFromSchema(APP_SCHEMA);
        } catch (e) {
            // Ignore errors.
        }

        this.resolveDB(CoreApp.getDB());
    }

    /**
     * Get value.
     *
     * @param key Data key.
     * @param defaultValue Value to return if the key wasn't found.
     * @return Data value.
     */
    async get<T=unknown>(key: string): Promise<T | null>;
    async get<T>(key: string, defaultValue: T): Promise<T>;
    async get<T=unknown>(key: string, defaultValue: T | null = null): Promise<T | null> {
        try {
            const db = await this.db;
            const entry = await db.getRecord<CoreStorageRecord>(TABLE_NAME, { key });

            return JSON.parse(entry.value);
        } catch (error) {
            return defaultValue;
        }
    }

    /**
     * Set value.
     *
     * @param key Data key.
     * @param value Data value.
     */
    async set(key: string, value: unknown): Promise<void> {
        const db = await this.db;

        await db.insertRecord(TABLE_NAME, { key, value: JSON.stringify(value) });
    }

    /**
     * Check if value exists.
     *
     * @param key Data key.
     * @return Whether key exists or not.
     */
    async has(key: string): Promise<boolean> {
        try {
            const db = await this.db;
            const count = await db.countRecords(TABLE_NAME, { key });

            return count > 0;
        } catch (error) {
            return false;
        }
    }

    /**
     * Remove value.
     *
     * @param key Data key.
     */
    async remove(key: string): Promise<void> {
        const db = await this.db;

        await db.deleteRecords(TABLE_NAME, { key });
    }

}

export const CoreStorage = makeSingleton(CoreStorageService) as CoreStorageSingleton;

const instances: Record<string, CoreStorageService> = {};

/**
 * Singleton providing static access to instances.
 */
type CoreStorageSingleton = CoreSingletonProxy< CoreStorageService & {
    forSite: (site: CoreSite) => CoreStorageService;
}>;

Object.defineProperty(CoreStorage, 'forSite', {
    value(site: CoreSite): CoreStorageService {
        const siteId = site.id!;

        if (!(siteId in instances)) {
            const siteStorage = new CoreStorageService();

            siteStorage.resolveDB(site.getDb());
            instances[siteId] = siteStorage;
        }

        return instances[siteId];
    },
});
