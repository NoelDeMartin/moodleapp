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

import WebServiceRequest from '../models/WebServiceRequest';
import Plugin from './Plugin';
import { EventBus } from './plugins';

export default class WebServicesQueuePlugin extends Plugin {

    name = 'WebServicesQueue';

    requests: Record<string, WebServiceRequest> = {};

    async onInitialize(): Promise<void> {
        EventBus.on('webservicesqueue', (event, data) => {
            switch (event) {
                case 'success': {
                    const { id, response } = data as { id: string; response: IWebServiceResponse } ?? {};

                    this.requests[id]?.completed(response);
                    break;
                }
            }
        });

        await this.loadRequests();
    }

    async startRequest<T=unknown>(url: string, title?: string): Promise<WebServiceRequest<T>> {
        const id = await this.callNative<string>('start-request', { url, title });

        return this.requests[id] = new WebServiceRequest<T>(id, url);
    }

    async consumeRequest(id: string): Promise<void> {
        await this.callNative<string>('consume-request', id);
    }

    private async loadRequests(): Promise<void> {
        const requests = await this.callNative<IWebServiceRequest[]>('get-requests');

        for (const { id, url, response } of requests) {
            const request = new WebServiceRequest(id, url);

            if (response) {
                request.completed(response);
            }

            this.requests[id] = request;
        }
    }

}
