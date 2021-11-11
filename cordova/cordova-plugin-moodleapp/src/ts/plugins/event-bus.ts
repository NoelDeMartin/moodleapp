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

/**
 * Event Bus Listener.
 */
export type EventBusListener = (event: string, data: unknown) => void;

/**
 * Event Data.
 */
export interface EventData {
    // This interface is augmented in other files with other events.
}

/**
 * Event payload.
 */
export interface EventPayload<Event extends keyof EventData> {
    event: Event;
    data?: EventData[Event];
}

/**
 * Manages native events.
 */
export class EventBus {

    /**
     * Initialize plugin.
     */
    async initialize(listener: EventBusListener): Promise<void> {
        return new Promise((resolve, reject) => {
            const onSuccess = (payload: { event: string; data?: unknown}) => {
                if (payload.event === 'ready') {
                    resolve();

                    return;
                }

                listener(payload.event, payload.data);
            };

            cordova.exec(onSuccess, reject, 'EventBus', 'init', []);
        });
    }

}
