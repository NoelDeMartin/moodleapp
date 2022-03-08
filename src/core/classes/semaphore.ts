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

type Listener = () => void;

export class CoreSemaphore {

    private count: number;
    private listeners: Set<Listener>;

    constructor(count: number = 1) {
        this.count = count;
        this.listeners = new Set();
    }

    async acquire(): Promise<void> {
        await this.waitAvailable();

        this.count = Math.max(this.count - 1, 0);
    }

    release(): void {
        this.count++;

        this.notifyAvailable();
    }

    async run<T>(operation: () => Promise<T>): Promise<T> {
        await this.acquire();

        const result = await operation();
        this.release();

        return result;
    }

    private async waitAvailable(): Promise<void> {
        while (this.count === 0) {
            await new Promise(resolve => {
                const listener = () => {
                    this.listeners.delete(listener);

                    resolve(null);
                };

                this.listeners.add(listener);
            });
        }
    }

    private notifyAvailable(): void {
        this.listeners.forEach(listener => listener());
    }

}
