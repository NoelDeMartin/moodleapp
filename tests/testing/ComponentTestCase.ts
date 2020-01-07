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

export default class ComponentTestCase<C> extends UnitTestCase<C> {

    constructor(componentClass: Type<C>, config: Config = {}) {
        super(componentClass, config);

        this.componentClass = componentClass;
        this.rootComponentClass = config.template
            ? declareWrapperComponent(config.template, componentClass)
            : componentClass;
    }

    private rootComponentClass: Type<C | Wrapper<C>>;
    private componentClass: Type<C>;
    private _fixture?: ComponentFixture<C | Wrapper<C>>;

    get fixture(): ComponentFixture<C | Wrapper<C>> {
        return this._fixture;
    }

    get usesTemplate(): boolean {
        return this.rootComponentClass !== this.componentClass;
    }

    configureTestingModule(metadata: TestModuleMetadata = {}): void {
        this.createDependencyInstances();

        metadata.declarations = metadata.declarations || [];
        metadata.imports = metadata.imports || [];
        metadata.providers = metadata.providers || [];

        metadata.declarations.push(this.rootComponentClass);
        metadata.imports.push(IonicModule.forRoot(this.rootComponentClass));
        metadata.providers.push(...this.dependencies.map((dependency, index) => ({
            provide: dependency,
            useValue: this.dependencyInstances[index],
        })));

        if (this.usesTemplate) {
            metadata.declarations.push(this.componentClass);
        }

        TestBed.configureTestingModule(metadata);
    }

    render(): HTMLElement {
        this.createInstance();

        return this.fixture.nativeElement;
    }

    // Override
    createInstance(): C {
        this._fixture = TestBed.createComponent<C | Wrapper<C>>(this.rootComponentClass);

        this.fixture.autoDetectChanges(true);

        this._instance = this.fixture.componentInstance instanceof Wrapper
            ? this.fixture.componentInstance.child
            : this.fixture.componentInstance;

        return this.instance;
    }

    // Override
    async whenAsyncOperationsFinished(): Promise<void> {
        await super.whenAsyncOperationsFinished();
        await this.fixture.whenStable();
    }
}

function declareWrapperComponent<C>(template: string, componentClass: Type<C>): Type<Wrapper<C>> {
    @Component({ template })
    class W extends Wrapper<C> {
        @ViewChild(componentClass) child: C;
    }

    return W;
}

abstract class Wrapper<C> {
    child: C;
}
