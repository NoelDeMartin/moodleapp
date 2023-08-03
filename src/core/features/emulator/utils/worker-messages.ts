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

export interface InitializeMessage {
    name: 'initialize';
    databaseName: string;
    sqliteScript: string;
}

export interface InitializedMessage {
    name: 'initialized';
}

export interface CallMethodMessage {
    name: 'call-method';
    id: number;
    method: string | number | symbol;
    args: unknown[];
}

export interface CallResultMessage {
    name: 'call-result';
    id: number;
    success?: unknown;
    error?: unknown;
}

/**
 * Check whether the given data is an initialize message.
 *
 * @param message Message.
 * @returns Whether the data is an initialize message.
 */
export function isInitializeMessage(message: unknown): message is InitializeMessage {
    return typeof message === 'object'
        && message !== null
        && 'name' in message
        && message['name'] === 'initialize';
}

/**
 * Check whether the given data is an initialized message.
 *
 * @param message Message.
 * @returns Whether the data is an initialized message.
 */
export function isInitializedMessage(message: unknown): message is InitializedMessage {
    return typeof message === 'object'
        && message !== null
        && 'name' in message
        && message['name'] === 'initialized';
}

/**
 * Check whether the given data is a call method message.
 *
 * @param message Message.
 * @returns Whether the data is a call method message.
 */
export function isCallMethodMessage(message: unknown): message is CallMethodMessage {
    return typeof message === 'object'
        && message !== null
        && 'name' in message
        && message['name'] === 'call-method';
}

/**
 * Check whether the given data is a call result message.
 *
 * @param message Message.
 * @returns Whether the data is a call result message.
 */
export function isCallResultMessage(message: unknown): message is CallResultMessage {
    return typeof message === 'object'
        && message !== null
        && 'name' in message
        && message['name'] === 'call-result';
}

/**
 * Create an initialize message.
 *
 * @returns Message.
 */
export function initializeMessage(databaseName: string, sqliteScript: string): InitializeMessage {
    return {
        name: 'initialize',
        databaseName,
        sqliteScript,
    };
}

/**
 * Create an initialized message.
 *
 * @returns Message.
 */
export function initializedMessage(): InitializedMessage {
    return { name: 'initialized' };
}

/**
 * Create a call method message.
 *
 * @param id Operation id.
 * @param method Method to call.
 * @param args Call arguments.
 * @returns Message.
 */
export function callMethodMessage(id: number, method: string | number | symbol, args: unknown[]): CallMethodMessage {
    return {
        name: 'call-method',
        id,
        method,
        args,
    };
}

/**
 * Create a call result message.
 *
 * @param id Operation id.
 * @param result Call result.
 * @returns Message.
 */
export function callResultMessage(id: number, result?: { success?: unknown; error?: unknown }): CallResultMessage {
    return {
        name: 'call-result',
        id,
        success: result?.success,
        error: result?.error,
    };
}
