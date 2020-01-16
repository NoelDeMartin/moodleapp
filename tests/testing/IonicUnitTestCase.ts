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

import { IonicModule } from 'ionic-angular';
import { TestBed, ComponentFixture, TestModuleMetadata } from '@angular/core/testing';
import { Type, Component, ViewChild } from '@angular/core';
import UnitTestCase, { Config as BaseConfig } from './UnitTestCase';

export interface Config extends BaseConfig {
    template?: string;
}

export default class IonicUnitTestCase<U> extends UnitTestCase<U> {

    constructor(unitConstructor: Type<U>, config: Config = {}) {
        super(unitConstructor, config);

        if (config.template) {
            this.rootComponent = declareWrapperComponent(config.template, unitConstructor);
        } else {
            this.rootComponent = unitConstructor;
        }
    }

    private rootComponent: Type<U | Wrapper<U>>;
    private _fixture?: ComponentFixture<U | Wrapper<U>>;

    get fixture(): ComponentFixture<U | Wrapper<U>> {
        return this._fixture;
    }

    get usesTemplate(): boolean {
        return this.rootComponent !== this.unitConstructor;
    }

    configureTestingModule(metadata: TestModuleMetadata = {}): void {
        this.createDependencyInstances();

        // Initialize required configuration properties if they don't exist
        metadata.declarations = metadata.declarations || [];
        metadata.imports = metadata.imports || [];
        metadata.providers = metadata.providers || [];

        // Add test configuration
        const ionicModule = IonicModule.forRoot(this.rootComponent, { tapPolyfill: true });
        const dependencyProviders = this.dependencies.map((dependency, index) => ({
            provide: dependency,
            useValue: this.dependencyInstances[index],
        }));

        metadata.declarations.push(this.rootComponent);
        metadata.imports.push(ionicModule);
        metadata.providers.push(...dependencyProviders);

        if (this.usesTemplate) {
            metadata.declarations.push(this.unitConstructor);
        }

        // Initialize testing module
        TestBed.configureTestingModule(metadata);
    }

    render(): HTMLElement {
        this.createInstance();

        return this.fixture.nativeElement;
    }

    async asyncRender(): Promise<HTMLElement> {
        const element = this.render();

        await this.whenAsyncOperationsCompleted();

        return element;
    }

    async whenAsyncOperationsCompleted(): Promise<void> {
        await this.fixture.whenRenderingDone();
        await this.fixture.whenStable();
    }

    // Override
    createInstance(): U {
        this._fixture = TestBed.createComponent<U | Wrapper<U>>(this.rootComponent);

        this.fixture.autoDetectChanges(true);

        if (this.fixture.componentInstance instanceof Wrapper) {
            this._instance = this.fixture.componentInstance.child;
        } else {
            this._instance = this.fixture.componentInstance;
        }

        return this.instance;
    }

}

function declareWrapperComponent<U>(template: string, unitConstructor: Type<U>): Type<Wrapper<U>> {
    @Component({ template })
    class W extends Wrapper<U> {
        @ViewChild(unitConstructor) child: U;
    }

    return W;
}

abstract class Wrapper<U> {
    child: U;
}
