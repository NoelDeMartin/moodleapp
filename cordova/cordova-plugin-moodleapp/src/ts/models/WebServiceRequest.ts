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

import { WebServicesQueue } from '../plugins/plugins';

export const enum WebServiceRequestStatus {
    ONGOING = 'ONGOING',
    COMPLETED = 'COMPLETED',
}

export default class WebServiceRequest<T = unknown> {

    id: string;
    url: string;
    status: WebServiceRequestStatus;
    // status: Observable<WebServiceStatus>;
    response?: IWebServiceResponse<T>;

    constructor (id: string, url: string) {
        this.id = id;
        this.url = url;
        this.status = WebServiceRequestStatus.ONGOING;
    }

    completed(response: IWebServiceResponse<T>): void {
        this.status = WebServiceRequestStatus.COMPLETED;
        this.response = response;
    }

    async consume(): Promise<void> {
        await WebServicesQueue.consumeRequest(this.id);
    }

}
