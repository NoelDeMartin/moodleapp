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

import { WebServiceRequest, WebServiceRequestStatus } from 'cordova-plugin-moodleapp/src/ts/plugins/web-service-requests-queue';
import { Injectable } from '@angular/core';
import { makeSingleton } from '@singletons';

import { CoreNative } from './native';
import { CoreNativeEventBus } from './event-bus';

/**
 * Native download.
 */
export interface CoreNativeDownload {
    id: string;
    status: WebServiceRequestStatus;
}

/**
 * Manage background downloads.
 */
@Injectable({ providedIn: 'root' })
export class CoreNativeDownloadsService {

    private downloads!: Record<string, CoreNativeDownload>;

    /**
     * Initialize service.
     */
    async initialize(): Promise<void> {
        const queue = await CoreNative.plugin('webServiceRequestsQueue');

        // Get existing downloads.
        const requests = await queue.getRequests();

        this.downloads = requests.reduce((downloads, request) => {
            const download = this.parseRequest(request);

            downloads[request.id] = download;

            return downloads;
        }, {});

        // Subscribe to updates.
        CoreNativeEventBus.on('request-completed', ({ id }) => {
            this.downloads[id].status = WebServiceRequestStatus.Completed;
        });
    }

    async startDownload(url: string): Promise<void> {
        const queue = await CoreNative.plugin('webServiceRequestsQueue');
        const request = await queue.startRequest(url);
        const download = this.parseRequest(request);

        this.downloads[download.id] = download;
    }

    private parseRequest(request: WebServiceRequest): CoreNativeDownload {
        return {
            id: request.id,
            status: request.status,
        };
    }

}

export const CoreNativeDownloads = makeSingleton(CoreNativeDownloadsService);
