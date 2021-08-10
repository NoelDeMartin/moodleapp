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

import { EventBus } from './plugins';

export default abstract class Plugin {

    abstract name: string;

    ready: Promise<void>;
    private initialized: boolean;
    private resolveReady!: () => void;
    private rejectReady!: (reason?: unknown) => void;

    constructor() {
        this.initialized = false;
        this.ready = new Promise<void>((resolve, reject) => {
            this.resolveReady = resolve;
            this.rejectReady = reject;
        });
    }

    async initialize(): Promise<void> {
        if (this.initialized) {
            return;
        }

        try {
            await this.onInitialize().then(this.resolveReady);
        } catch (e) {
            this.rejectReady(e);

            throw e;
        }
    }

    protected abstract onInitialize(): Promise<void>;

    protected async callNative<T = unknown>(method: string, ...args: unknown[]): Promise<T> {
        await EventBus.ready;

        return new Promise((resolve, reject) => {
            cordova.exec(resolve, reject, this.name, method, args);
        });
    }

}
