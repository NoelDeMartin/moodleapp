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

import { CoreDatabaseParam } from '@classes/database/database';
import { CorePromisedValue } from '@classes/promised-value';

export interface CoreDatabaseWorkerMessageBase {
    id: string;
    type: string;
    payload: unknown[];
    response?: unknown;
}

export interface CoreDatabaseCreateDatabaseWorkerMessage extends CoreDatabaseWorkerMessageBase {
    type: 'createDatabase';
    payload: [name: string, sqliteScriptUrl: string];
    response?: void;
}

export interface CoreDatabaseExecuteWorkerMessage extends CoreDatabaseWorkerMessageBase {
    type: 'execute';
    payload: [sql: string, sqlParams?: CoreDatabaseParam[]];
    response?: void;
}

export interface CoreDatabaseWorkerMessageResponse<T extends CoreDatabaseWorkerMessageType = CoreDatabaseWorkerMessageType> {
    id: string;
    response: CoreDatabaseWorkerMessagesResponse[T];
}

export type CoreDatabaseWorkerMessage = CoreDatabaseCreateDatabaseWorkerMessage | CoreDatabaseExecuteWorkerMessage;
export type CoreDatabaseWorkerMessagesMap = {
    [TMessage in CoreDatabaseWorkerMessage as TMessage['type']]: TMessage;
};
export type CoreDatabaseWorkerMessagesPayload = {
    [TMessage in CoreDatabaseWorkerMessage as TMessage['type']]: TMessage['payload'];
};
export type CoreDatabaseWorkerMessagesResponse = {
    [TMessage in CoreDatabaseWorkerMessage as TMessage['type']]: TMessage['response'];
};
export type CoreDatabaseWorkerMessageType = CoreDatabaseWorkerMessage['type'];

let counter = 0;
const ongoingOperations: Record<string, CorePromisedValue> = {};

/**
 * Create response message.
 *
 * @param message Original message.
 * @param response Response.
 * @returns Response message.
 */
export function responseMessage<T extends CoreDatabaseWorkerMessage>(
    message: T,
    response: CoreDatabaseWorkerMessagesResponse[T['type']],
): CoreDatabaseWorkerMessageResponse<T['type']> {
    return { id: message.id, response };
}

/**
 * Create database worker message.
 *
 * @param worker Worker.
 * @param type Message type.
 * @param payload Message payload.
 * @returns Message.
 */
export function runDatabaseWorkerOperation<T extends CoreDatabaseWorkerMessageType>(
    worker: Worker,
    type: T,
    ...payload: CoreDatabaseWorkerMessagesPayload[T]
): Promise<CoreDatabaseWorkerMessagesResponse[T]> {
    const id = counter++;
    const response = ongoingOperations[id] = new CorePromisedValue<CoreDatabaseWorkerMessagesResponse[T]>();

    // TODO no need to do this every time a message is sent.
    worker.onmessage = function (event: MessageEvent) {
        const message = event.data as CoreDatabaseWorkerMessageResponse;

        if (!(message.id in ongoingOperations)) {
            return;
        }

        ongoingOperations[message.id].resolve(message.response);

        delete ongoingOperations[message.id];
    };

    worker.postMessage({ id, type, payload });

    return response;
}
