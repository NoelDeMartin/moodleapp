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

import type { Mp3WorkerConfig } from 'mp3-mediarecorder/types/config.type';

export interface InitEncoderMessage {
    name: 'init-encoder';
    config: Mp3WorkerConfig;
}

/**
 * Check whether the given data is an init encoder message.
 *
 * @param message Message.
 * @returns Whether the data is an init encoder message.
 */
export function isInitEncoderMessage(message: unknown): message is InitEncoderMessage {
    return typeof message === 'object'
        && message !== null
        && 'name' in message
        && message['name'] === 'init-encoder';
}

/**
 * Create an init encoder message.
 *
 * @param config Encoder config.
 * @returns Message.
 */
export function initEncoderMessage(config: Mp3WorkerConfig): InitEncoderMessage {
    return {
        name: 'init-encoder',
        config,
    };
}
