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

// Augment events interface with events specific to this plugin.
declare module './event-bus' {
    export interface EventData {
        'request-completed': {
            id: string;
            response: WebServiceResponse;
        };
        'request-failed': {
            id: string;
        };
    }
}

/**
 * Web service request.
 */
export interface WebServiceRequest {
    id: string;
    status: WebServiceRequestStatus;
    metadata: Record<string, unknown>;
    response?: WebServiceResponse;
}

/**
 * Web service request options.
 */
export interface WebServiceRequestOptions {
    method?: string;
    body?: string;
    headers?: Record<string, string>;
    metadata?: Record<string, unknown>;
}

/**
 * Web service response.
 */
export interface WebServiceResponse {
    statusCode: number;
    body: string;
}

/**
 * Web service request status.
 */
export const enum WebServiceRequestStatus {
    Ongoing = 'ongoing',
    Completed = 'completed',
    Failed = 'failed',
}

/**
 * Manages a queue of web service requests.
 */
export class WebServiceRequestsQueue {

    /**
     * Start a new network request.
     *
     * @param url Url.
     * @returns Request.
     */
    async startRequest(url: string, options: WebServiceRequestOptions): Promise<WebServiceRequest> {
        return new Promise((resolve, reject) => {
            cordova.exec(resolve, reject, 'WebServiceRequestsQueue', 'startRequest', [url, options]);
        });
    }

    /**
     * Get requests.
     *
     * @returns Requests.
     */
    async getRequests(): Promise<WebServiceRequest[]> {
        return new Promise((resolve, reject) => {
            cordova.exec(resolve, reject, 'WebServiceRequestsQueue', 'getRequests', []);
        });
    }

}
