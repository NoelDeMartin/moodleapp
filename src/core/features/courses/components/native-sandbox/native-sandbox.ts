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

import { Component, OnInit } from '@angular/core';
import { ToDo } from '@classes/models/todo';
import { CoreNative, WebServiceRequestStatus } from '@services/native';
import { CoreStorage } from '@services/storage';

@Component({
    selector: 'core-courses-native-sandbox',
    templateUrl: 'core-courses-native-sandbox.html',
})
export class CoreCoursesNativeSandboxComponent implements OnInit {

    todos: ToDo[] = [];

    constructor() {
        for (let i = 1; i < 20; i++) {
            this.todos.push(new ToDo(i.toString()));
        }
    }

    ngOnInit(): void {
        this.loadToDos();
    }

    async download(todo: ToDo): Promise<void> {
        todo.request = await CoreNative.startWebServiceRequest(todo.getDownloadUrl(), todo.getDownloadTitle());

        this.listenToDoStatus(todo);
    }

    private async loadToDos(): Promise<void> {
        const requests = CoreNative.getOngoingWebServiceRequests().reduce(
            (requests, request) => {
                requests[request.url] = request;

                return requests;
            },
            {},
        );

        for (const todo of this.todos) {
            todo.data = await CoreStorage.get(todo.getStorageKey(), undefined);
            todo.request = requests[todo.getDownloadUrl()];

            if (todo.request) {
                this.listenToDoStatus(todo);
            }
        }
    }

    // TODO use observable status instead of polling.
    private listenToDoStatus(todo: ToDo): void {
        if (todo.request?.status === WebServiceRequestStatus.COMPLETED) {
            if (todo.request.response?.data) {
                todo.data = JSON.parse(todo.request.response.data as string);

                CoreStorage.set(todo.getStorageKey(), todo.data);
            }

            todo.request.consume();

            delete todo.request;

            return;
        }

        setTimeout(() => this.listenToDoStatus(todo), 1000);
    }

}
