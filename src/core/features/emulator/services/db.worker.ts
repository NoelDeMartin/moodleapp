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
    CoreDatabaseWorkerMessage,
    CoreDatabaseWorkerMessagesPayload,
    CoreDatabaseWorkerMessagesResponse,
    CoreDatabaseWorkerMessageType,
    responseMessage,
} from '@features/emulator/utils/worker-messages';

const handlers: {
    [Type in CoreDatabaseWorkerMessageType]:
        (...payload: CoreDatabaseWorkerMessagesPayload[Type]) => CoreDatabaseWorkerMessagesResponse[Type];
} = {
    execute() {
        //
    },
    createDatabase() {
        //
    },
};

/**
 * Handle worker message.
 *
 * @param event Worker message event.
 */
function onMessage(event: MessageEvent): void {
    const message = event.data as CoreDatabaseWorkerMessage;
    const response = getHandler(message)(...message.payload);

    postMessage(responseMessage(message, response));
}

/**
 * Get message handler for the given message.
 *
 * @param message Message.
 * @returns Handler.
 */
function getHandler<T extends CoreDatabaseWorkerMessage>(
    message: T,
): (...payload: T['payload']) => CoreDatabaseWorkerMessagesResponse[T['type']] {
    return handlers[message.type];
}

addEventListener('message', onMessage);
