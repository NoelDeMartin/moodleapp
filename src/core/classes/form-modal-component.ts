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

import { ModalController } from '@singletons';

/**
 * Helper parent class to build form modals.
 */
export abstract class CoreFormModalComponent<T> {

    /**
     * Dismiss the modal.
     *
     * @param result Result data, or error instance if the modal was closed in failure.
     */
    async dismiss(result?: T | Error): Promise<void> {
        if (result instanceof Error) {
            await ModalController.dismiss(result, 'error');

            return;
        }

        await ModalController.dismiss(result, 'success');
    }

}
