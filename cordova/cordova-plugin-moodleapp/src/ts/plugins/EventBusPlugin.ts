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

import Plugin from './Plugin';

export type EventListener = (event: string, data?: unknown) => void;

export default class EventBusPlugin extends Plugin {

    name = 'EventBus';

    private listeners: Record<string, EventListener[]> = {};

    onInitialize(): Promise<void> {
        return new Promise((resolve, reject) => {
            cordova.exec(
                ({ event, data }) => {
                    if (event === 'ready') {
                        resolve();

                        return;
                    }

                    const [eventNamespace, eventName] = event.split(':');

                    this.emit(eventNamespace, eventName, data);
                },
                reject,
                this.name,
                'listen',
                [],
            );
        });
    }

    on(namespace: string, listener: EventListener): void {
        this.listeners[namespace] = this.listeners[namespace] ?? [];

        this.listeners[namespace].push(listener);
    }

    emit(namespace: string, event: string, data?: unknown): void {
        this.listeners[namespace]?.forEach(listener => listener(event, data));
    }

}
