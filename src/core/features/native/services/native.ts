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

import { Injectable } from '@angular/core';
import { makeSingleton, Platform } from '@singletons';

import { CoreNativeDownloads } from './downloads';
import { WebServiceRequestsQueueStub } from '../classes/web-service-requests-queue-stub';

type PluginStubConstructor<Plugin extends keyof MoodleAppPlugins> = { new(): PublicAPI<MoodleAppPlugins[Plugin]> };
type StubConstructors = { [Plugin in keyof MoodleAppPlugins]: PluginStubConstructor<Plugin> };

/**
 * Get the public API of a plugin.
 */
export type PublicAPI<Plugin> = { [Prop in keyof Plugin]: Plugin[Prop] };

/**
 * Native plugin manager.
 */
@Injectable({ providedIn: 'root' })
export class CoreNativeService {

    private readyPromise: Promise<void>;
    private resolveReady!: () => void;
    private stubs: Partial<MoodleAppPlugins>;
    private stubConstructors: StubConstructors;

    constructor() {
        this.readyPromise = new Promise(resolve => {
            this.resolveReady = resolve;
        });
        this.stubs = {};
        this.stubConstructors = {
            webServiceRequestsQueue: WebServiceRequestsQueueStub,
        };
    }

    /**
     * Initialize native services.
     */
    async initialize(): Promise<void> {
        await CoreNativeDownloads.initialize();

        this.resolveReady();
    }

    /**
     * Wait until the native service has been initialized.
     */
    ready(): Promise<void> {
        return this.readyPromise;
    }

    /**
     * Get a native plugin instance.
     *
     * @param plugin Plugin name.
     * @returns Plugin.
     */
    async plugin<Plugin extends keyof MoodleAppPlugins>(plugin: Plugin): Promise<MoodleAppPlugins[Plugin]> {
        await Platform.ready();

        return window.cordova?.MoodleApp?.[plugin]
            ?? this.getPluginStub(plugin);
    }

    /**
     * Get a stub for the given plugin.
     *
     * @param plugin Plugin.
     * @returns Plugin stub.
     */
    private getPluginStub<Plugin extends keyof MoodleAppPlugins>(plugin: Plugin): MoodleAppPlugins[Plugin] {
        if (!(plugin in this.stubs)) {
            this.stubs[plugin] = new this.stubConstructors[plugin]() as MoodleAppPlugins[Plugin];
        }

        return this.stubs[plugin]  as MoodleAppPlugins[Plugin];
    }

}

export const CoreNative = makeSingleton(CoreNativeService);
