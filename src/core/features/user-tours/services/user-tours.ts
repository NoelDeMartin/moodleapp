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
import { Injectable } from '@angular/core';
import { CoreDatabaseTable } from '@classes/database/database-table';
import { CoreDatabaseCachingStrategy, CoreDatabaseTableProxy } from '@classes/database/database-table-proxy';
import { CoreApp } from '@services/app';
import { AngularFrameworkDelegate, makeSingleton } from '@singletons';
import { CoreComponentsRegistry } from '@singletons/components-registry';
import { CoreUserToursUserTourComponent } from '../components/user-tour/user-tour';
import { APP_SCHEMA, CoreUserToursDBEntry, USER_TOURS_TABLE_NAME } from './database/user-tours';

/**
 * Service to manage user tours.
 */
@Injectable({ providedIn: 'root' })
export class CoreUserToursService {

    protected table = asyncInstance<CoreDatabaseTable<CoreUserToursDBEntry>>();

    /**
     * Initialize database.
     */
    async initializeDatabase(): Promise<void> {
        try {
            await CoreApp.createTablesFromSchema(APP_SCHEMA);
        } catch (e) {
            // Ignore errors.
        }

        this.table.setLazyConstructor(async () => {
            const table = new CoreDatabaseTableProxy<CoreUserToursDBEntry>(
                { cachingStrategy: CoreDatabaseCachingStrategy.Eager },
                CoreApp.getDB(),
                USER_TOURS_TABLE_NAME,
                ['id'],
            );

            await table.initialize();

            return table;
        });
    }

    async shouldShow(id: string): Promise<boolean> {
        if (this.getUserTours().length > 0) {
            return false;
        }

        // TODO allow to disable by config

        return this.table.hasAnyByPrimaryKey({ id });
    }

    async acknowledge(id: string): Promise<void> {
        await this.table.insert({ id, acknowledgedTime: Date.now() });
    }

    async show(options: CoreUserToursCreateOptions): Promise<CoreUserToursUserTour> {
        const container = document.querySelector('ion-app') ?? document.body;
        const element = await AngularFrameworkDelegate.attachViewToDom(
            container,
            CoreUserToursUserTourComponent,
            {
                ...options,
                container,
            },
        );
        const userTour = CoreComponentsRegistry.require(element, CoreUserToursUserTourComponent);

        await userTour.present();

        return userTour;
    }

    async dismiss(): Promise<void> {
        const userTours = this.getUserTours();

        if (userTours.length === 0) {
            return;
        }

        await userTours[userTours.length - 1].dismiss();
    }

    protected getUserTours(): CoreUserToursUserTourComponent[] {
        return Array
            .from(document.querySelectorAll('core-user-tours-user-tour'))
            .map(element => CoreComponentsRegistry.resolve(element, CoreUserToursUserTourComponent))
            .filter((userTour: unknown): userTour is CoreUserToursUserTourComponent => !!userTour);
    }

}

export const CoreUserTours = makeSingleton(CoreUserToursService);

export interface CoreUserToursCreateOptions {
    id: string;
    component: unknown;
    componentProps?: Record<string, unknown>;
    focusedElement?: HTMLElement;
}

export interface CoreUserToursUserTour {
    dismiss(): Promise<void>;
}
