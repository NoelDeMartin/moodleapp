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

import { mock, reset, instance } from '@testing/mocking';
import { Type } from '@angular/core';

export interface Config {
    dependencies?: any[];
}

export default class UnitTestCase<U> {

    constructor(unitConstructor: Type<U>, config: Config = {}) {
        this.unitConstructor = unitConstructor;
        this.dependencies = config.dependencies || [];
        this.dependencyMocks = this.dependencies.map((dependency) => typeof dependency === 'string' ? mock() : mock(dependency));
        this.asyncOperationPromises = [];
    }

    protected unitConstructor: Type<U>;
    protected dependencies: any[];
    protected dependencyMocks: any[];
    protected dependencyInstances: any[];
    protected asyncOperationPromises: Promise<any>[];
    protected _instance?: U;

    get instance(): U {
        return this._instance;
    }

    getDependencyMock<D>(dependency: Type<D> | string): D {
        const index = this.dependencies.indexOf(dependency);

        return this.dependencyMocks[index];
    }

    reset(): void {
        delete this._instance;

        this.dependencyMocks.forEach(reset);
        this.asyncOperationPromises = [];
    }

    resolvedAsyncOperation<R>(result?: R): Promise<R> {
        return this.asyncOperation(Promise.resolve(result));
    }

    rejectedAsyncOperation<R>(reason?: R): Promise<R> {
        return this.asyncOperation(Promise.reject(reason));
    }

    asyncOperation<R>(promise: Promise<R> | (() => Promise<R>)): Promise<R> {
        if (typeof promise === 'function') {
            promise = promise();
        }

        this.asyncOperationPromises.push(promise);

        return promise;
    }

    createInstance(): U {
        this.createDependencyInstances();

        this._instance = new (this.unitConstructor)(...this.dependencyInstances);

        return this._instance;
    }

    async whenAsyncOperationsFinished(): Promise<void> {
        const promises = this.asyncOperationPromises.map(
            (promise) => promise.catch(() => {
                // Silence rejections, we want to wait until all promises are completed regardless
                // Of being rejected or resolved.
            }),
        );

        await Promise.all(promises);
    }

    protected createDependencyInstances(): void {
        this.dependencyInstances = this.dependencyMocks.map(instance);
    }

}
