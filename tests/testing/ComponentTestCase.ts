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
import { mock, reset, instance } from 'ts-mockito';
import { TestBed, ComponentFixture, TestModuleMetadata } from '@angular/core/testing';
import { Type, Component } from '@angular/core';

type Host = {};

export interface Config {
    template?: string;
    services?: any[];
}

export default class ComponentTestCase<C> {

    constructor(component: Type<C>, config: Config = {}) {
        this.component = component;
        this.services = config.services || [];
        this.serviceMocks = this.services.map(mock);

        if (config.template) {
            this.rootComponent = declareHostComponent(config.template);
        } else {
            this.rootComponent = component;
        }
    }

    private rootComponent: Type<C> | Type<Host>;
    private component: Type<C>;
    private services: any[];
    private serviceMocks: any[];
    private _fixture?: ComponentFixture<C> | ComponentFixture<Host>;

    get fixture(): ComponentFixture<C> | ComponentFixture<Host> {
        return this._fixture;
    }

    configureTestingModule(metadata: TestModuleMetadata = {}): void {
        this.serviceMocks.forEach(reset);

        metadata.declarations = metadata.declarations || [];
        metadata.imports = metadata.imports || [];
        metadata.providers = metadata.providers || [];

        metadata.declarations.push(this.component);
        metadata.imports.push(IonicModule.forRoot(this.component));
        metadata.providers.push(...this.serviceMocks.map((serviceMock, index) => ({
            provide: this.services[index],
            useValue: instance(serviceMock),
        })));

        if (this.usesTemplate()) {
            metadata.declarations.push(this.rootComponent);
        }

        TestBed.configureTestingModule(metadata);
    }

    render(): HTMLElement {
        this._fixture = TestBed.createComponent(this.rootComponent);

        this.fixture.detectChanges();

        return this.fixture.nativeElement;
    }

    usesTemplate(): boolean {
        return this.rootComponent !== this.component;
    }

}

function declareHostComponent(template: string): Type<Host> {
    @Component({ template })
    class HostComponent implements Host {}

    return HostComponent;
}
