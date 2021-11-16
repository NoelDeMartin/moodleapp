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

import { WebServiceRequestStatus, WebServiceResponse } from 'cordova-plugin-moodleapp/src/ts/plugins/web-service-requests-queue';

type Listener = () => void;

/**
 * Download request.
 */
export class CoreNativeDownload {

    id: string;
    status: WebServiceRequestStatus;
    metadata: Record<string, unknown>;
    response?: WebServiceResponse;

    private listeners: Record<'completed' | 'failed', Listener[]>;

    constructor(id: string, status: WebServiceRequestStatus, metadata: Record<string, unknown>) {
        this.id = id;
        this.status = status;
        this.metadata = metadata;
        this.listeners = {
            completed: [],
            failed: [],
        };
    }

    /**
     * Mark a download as completed.
     *
     * @param response Request response.
     */
    complete(response: WebServiceResponse): void {
        this.status = WebServiceRequestStatus.Completed;
        this.response = response;

        this.listeners.completed.forEach(listener => listener());
    }

    /**
     * Mark a download as failed.
     */
    fail(): void {
        this.status = WebServiceRequestStatus.Failed;

        this.listeners.failed.forEach(listener => listener());
    }

    /**
     * Register listener for download completion.
     *
     * @param listener Listener.
     * @returns Unsubscribe function.
     */
    onCompleted(listener: Listener): () => void {
        this.listeners.completed.push(listener);

        return () => {
            const index = this.listeners.completed.indexOf(listener);

            if (index === -1) {
                return;
            }

            this.listeners.completed.splice(index, 1);
        };
    }

    /**
     * Register listener for download failure.
     *
     * @param listener Listener.
     * @returns Unsubscribe function.
     */
    onFailed(listener: Listener): () => void {
        this.listeners.failed.push(listener);

        return () => {
            const index = this.listeners.failed.indexOf(listener);

            if (index === -1) {
                return;
            }

            this.listeners.failed.splice(index, 1);
        };
    }

}
