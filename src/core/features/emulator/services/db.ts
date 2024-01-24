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

import { asyncInstance } from '@/core/utils/async-instance';
import { CoreBrowserDatabase } from '@classes/database/browser-database';
import { CoreDatabase } from '@classes/database/database';
import { CoreDbProvider } from '@services/db';
import { Sqlite3Worker1Promiser, sqlite3Worker1Promiser } from '@sqlite.org/sqlite-wasm';

/**
 * Emulates the database provider in the browser.
 */
export class CoreDbProviderMock extends CoreDbProvider {

    /**
     * @inheritdoc
     */
    protected createDatabase(name: string): CoreDatabase {
        return asyncInstance(async () => {
            const promiser = await new Promise<Sqlite3Worker1Promiser>((resolve) => {
                const _promiser = sqlite3Worker1Promiser(() => resolve(_promiser));
            });

            await promiser('open', { filename: `file:${name}.sqlite3`, vfs: 'opfs' });

            // TODO set up database spies

            return new CoreBrowserDatabase(promiser);
        });
    }

    /**
     * @inheritdoc
     */
    protected deleteDatabase(name: string): Promise<void> {
        throw new Error(`Method not implemented attempting to delete '${name}' database.`);
    }

}
