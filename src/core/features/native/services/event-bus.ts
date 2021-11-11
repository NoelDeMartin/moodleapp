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

import { EventData } from 'cordova-plugin-moodleapp/src/ts/plugins/event-bus';
import { Injectable } from '@angular/core';
import { makeSingleton } from '@singletons';

import { CoreNative } from './native';

type Listener<Data = unknown> = (data: Data) => void;

/**
 * Manage native events.
 */
@Injectable({ providedIn: 'root' })
export class CoreNativeEventBusService {

    private listeners: { [Event in keyof EventData]?: Listener[] } = {};

    /**
     * Initialize service.
     */
    async initialize(): Promise<void> {
        const plugin = await CoreNative.plugin('eventBus');

        await plugin.initialize((event, data) => {
            this.listeners[event]?.forEach(listener => listener(data));
        });
    }

    /**
     * Listen to native event.
     *
     * @param event Event name.
     * @param listener Listener.
     * @returns Unsubscribe function.
     */
    on<Event extends keyof EventData>(event: Event, listener: Listener<EventData[Event]>): () => void {
        if (!(event in this.listeners)) {
            this.listeners[event] = [];
        }

        const _listener = listener as Listener;

        this.listeners[event]?.push(_listener);

        return () => this.off(event, _listener);
    }

    /**
     * Stop listening to a native event.
     *
     * @param event Event name.
     * @param listener Listener.
     */
    off(event: keyof EventData, listener: Listener): void {
        const index = this.listeners[event]?.indexOf(listener) ?? -1;

        if (index === -1) {
            return;
        }

        this.listeners[event]?.splice(index, 1);
    }

}

export const CoreNativeEventBus = makeSingleton(CoreNativeEventBusService);
