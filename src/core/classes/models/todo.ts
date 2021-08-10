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

export class ToDo {

    id: string;
    data?: { id: string; userId: string; title: string; compleeted: boolean };
    request?: IWebServiceRequest;

    constructor(id: string) {
        this.id = id;
    }

    getStorageKey(): string {
        return `todo-${this.id}`;
    }

    getDownloadUrl(): string {
        return `https://jsonplaceholder.cypress.io/todos/${this.id}`;
    }

    getDownloadTitle(): string {
        return `TODO ${this.id} download`;
    }

    isDownloading(): boolean {
        return !!this.request;
    }

    isDownloaded(): boolean {
        return !!this.data;
    }

}
