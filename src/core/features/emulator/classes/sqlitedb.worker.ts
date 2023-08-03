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

import type { Sqlite3Env, DatabaseApi } from './sqlitedb.types';
import {
    isInitializeMessage,
    initializedMessage,
    isCallMethodMessage,
    callResultMessage,
} from '@features/emulator/utils/worker-messages';

let database: DatabaseApi | null = null;

/**
 * Initialize database instance.
 *
 * @param name Database name.
 * @returns Database.
 */
async function initialize(name: string, sqliteScript: string): Promise<DatabaseApi> {
    await globalThis.importScripts(sqliteScript);

    const sqlite3InitModule = (globalThis as unknown as Sqlite3Env).sqlite3InitModule;
    const module = await sqlite3InitModule();
    const sqlite3 = 'sqlite3' in module ? module.sqlite3 : module;

    return sqlite3.opfs
        ? new sqlite3.oo1.OpfsDb(`/${name}.sqlite3`)
        : new sqlite3.oo1.DB(`/${name}.sqlite3`, 'ct');
}

/**
 * Handle worker message.
 *
 * @param event Worker message event.
 */
function onMessage(event: MessageEvent): void {
    if (isInitializeMessage(event.data)) {
        initialize(event.data.databaseName, event.data.sqliteScript)
            .then(db => {
                database = db;

                return (postMessage as any)(initializedMessage());
            })
            .catch(error => {
                throw error;
            });

        return;
    }

    if (isCallMethodMessage(event.data)) {
        if (database === null) {
            throw new Error('Worker database not initialized yet!');
        }

        try {
            const result = database[event.data.method].call(database, ...event.data.args);

            if ('then' in result) {
                result
                    .then(result => (postMessage as any)(callResultMessage(event.data.id, { success: result })))
                    .catch(error => (postMessage as any)(callResultMessage(event.data.id, { error })));
            } else {
                (postMessage as any)(callResultMessage(event.data.id, { success: result }));
            }
        } catch (error) {
            (postMessage as any)(callResultMessage(event.data.id, { error }));
        }

        return;
    }
}

addEventListener('message', onMessage);
