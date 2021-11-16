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

import {
    WebServiceRequestsQueue,
    WebServiceRequest,
    WebServiceRequestStatus,
    WebServiceRequestOptions,
} from 'cordova-plugin-moodleapp/src/ts/plugins/web-service-requests-queue';

import { CoreNative, PublicAPI } from '../services/native';
import { EventBusStub } from './event-bus-stub';

const STORAGE_KEY = 'WebServiceRequestsQueueStub';

interface WebServiceRequestStub {
    parameters: {
        method: string;
        url: string;
        headers: Record<string, string>;
        body: string | null;
    };
    request: WebServiceRequest;
}

/**
 * Stub for platforms where the native plugin is not supported.
 */
export class WebServiceRequestsQueueStub implements PublicAPI<WebServiceRequestsQueue> {

    private requests: WebServiceRequestStub[];

    constructor() {
        this.requests = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');

        Object.values(this.requests).forEach(
            request => request.request.status === WebServiceRequestStatus.Ongoing && this.processRequest(request),
        );
    }

    /**
     * @inheritdoc
     */
    async startRequest(url: string, options: WebServiceRequestOptions): Promise<WebServiceRequest> {
        const requestStub: WebServiceRequestStub = {
            parameters: {
                url,
                method: options.method ?? 'GET',
                headers: options.headers ?? {},
                body: options.body ?? null,
            },
            request: {
                id: Date.now().toString(),
                status: WebServiceRequestStatus.Ongoing,
                metadata: options.metadata ?? {},
            },
        };

        this.requests.push(requestStub);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.requests));

        this.processRequest(requestStub);

        return requestStub.request;
    }

    /**
     * @inheritdoc
     */
    async getRequests(): Promise<WebServiceRequest[]> {
        return this.requests.map(({ request }) => request);
    }

    /**
     * Start processing a request.
     *
     * @param requestStub Request stub.
     */
    private async processRequest(requestStub: WebServiceRequestStub): Promise<void> {
        try {
            const response = await fetch(requestStub.parameters.url, {
                method: requestStub.parameters.method,
                body: requestStub.parameters.body,
                headers: requestStub.parameters.headers,
            });
            const body = await response.text();

            requestStub.request.status = WebServiceRequestStatus.Completed;
            requestStub.request.response = {
                statusCode: response.status,
                body,
            };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(this.requests));

            (await CoreNative.plugin('eventBus') as EventBusStub).emit('request-completed', {
                id: requestStub.request.id,
                response: requestStub.request.response,
            });
        } catch (error) {
            requestStub.request.status = WebServiceRequestStatus.Failed;
            localStorage.setItem(STORAGE_KEY, JSON.stringify(this.requests));

            (await CoreNative.plugin('eventBus') as EventBusStub).emit('request-failed', {
                id: requestStub.request.id,
            });
        }
    }

}
