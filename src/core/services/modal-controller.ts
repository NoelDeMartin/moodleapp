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

import { Constructor } from '@/core/utils/types';
import { Injectable } from '@angular/core';
import { CoreFormModalComponent } from '@classes/form-modal-component';
import { ModalOptions } from '@ionic/angular';
import { makeSingleton, ModalController } from '@singletons';

/**
 * Handles application modals.
 */
@Injectable({ providedIn: 'root' })
export class CoreModalControllerService {

    /**
     * Opens a form modal and returns the data upon submission.
     *
     * @param component Modal component.
     * @param options Modal options.
     * @returns Form result.
     */
    async openForm<T>(
        component: Constructor<CoreFormModalComponent<T>>,
        options: Omit<ModalOptions, 'component'>,
    ): Promise<T | undefined> {
        const modal = await ModalController.create({
            ...options,
            component,
        });

        await modal.present();

        const result = await modal.onWillDismiss();

        if (result.role !== 'success') {
            throw result.data;
        }

        return result.data;
    }

}

export const CoreModalController = makeSingleton(CoreModalControllerService);
