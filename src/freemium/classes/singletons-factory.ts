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

import { Injector, Type } from '@angular/core';

/**
 * Stub class used to type anonymous class created in SingletonsFactory#makeSingleton method.
 */
export class Singleton {}

/**
 * Factory used to create Singleton classes that get instances from an injector.
 */
export class SingletonsFactory {

    /**
     * Angular injector used to resolve singleton instances.
     */
    private injector: Injector;

    /**
     * Set the injector that will be used to resolve instances in the singletons created with this factory.
     *
     * @param injector Injector.
     */
    setInjector(injector: Injector): void {
        this.injector = injector;
    }

    /**
     * Make a singleton that will hold an instance resolved from the factory injector.
     *
     * @param serviceToken Class of the instance held by the singleton. This should also be the same class that was used to define
     * the provider, or the string that was used in the `provide` key if it was defined using an object.
     */
    makeSingleton<Service>(serviceToken: Type<Service> | string): typeof Singleton & { instance: Service } {
        // tslint:disable: no-this-assignment
        const factory = this;

        return class {

            private static _instance: Service;

            static get instance(): Service {
                // Lazy instance initialization
                if (!this._instance) {
                    this._instance = factory.injector.get(serviceToken);
                }

                return this._instance;
            }

        };
    }

}
