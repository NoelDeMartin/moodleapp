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

// TODO these types should not be global
type WebServiceRequestStatusValue = 'ONGOING' | 'COMPLETED';

interface IWebServiceResponse<T = unknown> {
    status: number;
    data: T;
}

interface IWebServiceRequest<T = unknown> {
    id: string;
    url: string;
    status: WebServiceRequestStatusValue;
    // status: Observable<WebServiceRequestStatus>;
    response?: IWebServiceResponse<T>;

    consume(): void;
}

interface MoodleApp {
    startWebServiceRequest<T=unknown>(url: string, title?: string): Promise<IWebServiceRequest<T>>;
    getOngoingWebServiceRequests(): IWebServiceRequest[];
}

interface Cordova {

    // eslint-disable-next-line @typescript-eslint/naming-convention
    MoodleApp: MoodleApp;

}

// TODO workaround for esbuild obfuscating `module` keyword from index.js
// (this is replaced in build.js script)
interface Window {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    CORDOVA_MODULE: any;
}
