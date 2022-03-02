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

import { AfterViewInit, Component, ElementRef, HostBinding, Input, OnInit } from '@angular/core';
import { CorePromisedValue } from '@classes/promised-value';
import { CoreUserTours, CoreUserToursUserTour } from '@features/user-tours/services/user-tours';
import { AngularFrameworkDelegate } from '@singletons';
import { CoreComponentsRegistry } from '@singletons/components-registry';

@Component({
    selector: 'core-user-tours-user-tour',
    templateUrl: 'core-user-tours-user-tour.html',
    styleUrls: ['user-tour.scss'],
})
export class CoreUserToursUserTourComponent implements AfterViewInit, OnInit, CoreUserToursUserTour {

    @Input() container!: HTMLElement;
    @Input() id!: string;
    @Input() component!: unknown;
    @Input() componentProps?: Record<string, unknown>;
    @Input() focusedElement?: HTMLElement;
    @HostBinding('class.is-active') active = false;
    @HostBinding('class.is-focused') focused = false;

    overlayFocus?: { centerX: number; centerY: number; radius: number };
    wrapperStyles?: string;

    private element: HTMLElement;
    private wrapperElement = new CorePromisedValue<HTMLElement>();

    constructor({ nativeElement: element }: ElementRef<HTMLElement>) {
        this.element = element;

        CoreComponentsRegistry.register(element, this);
    }

    get overlayMaskId(): string {
        return `${this.id}-mask`;
    }

    get overlayMask(): string {
        return `url(#${this.id}-mask)`;
    }

    ngOnInit(): void {
        if (!this.focusedElement) {
            return;
        }

        const boundingBox = this.focusedElement.getBoundingClientRect();
        const radius = boundingBox.width / 2;

        this.overlayFocus = {
            centerX: boundingBox.x + radius,
            centerY: boundingBox.y + radius,
            radius,
        };
        this.wrapperStyles = `bottom:${window.innerHeight - boundingBox.top}px`;
        this.focused = true;
    }

    ngAfterViewInit(): void {
        this.wrapperElement.resolve(this.element.querySelector('.user-tour-wrapper') as HTMLElement);
    }

    async present(): Promise<void> {
        const wrapper = await this.wrapperElement;

        await AngularFrameworkDelegate.attachViewToDom(wrapper, this.component, this.componentProps ?? {});

        this.active = true;
    }

    async dismiss(acknowledge: boolean = true): Promise<void> {
        AngularFrameworkDelegate.removeViewFromDom(this.container, this.element);

        acknowledge && CoreUserTours.acknowledge(this.id);
    }

}
