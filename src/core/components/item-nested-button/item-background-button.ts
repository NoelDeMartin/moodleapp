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

import { AfterViewInit, Component, ElementRef, EventEmitter, Output } from '@angular/core';
import { CoreUtils } from '@services/utils/utils';

/**
 * Component to make an ion-item's background clickable. This is useful in the situations where
 * an ion-item has buttons inside, to avoid nested interactive elements.
 */
@Component({
    selector: 'core-item-background-button',
    templateUrl: 'core-item-background-button.html',
    styleUrls: ['item-background-button.scss'],
})
export class CoreItemBackgroundButtonComponent implements AfterViewInit {

    @Output() onClick = new EventEmitter();

    constructor(protected elementRef: ElementRef<HTMLElement>) {}

    /**
     * @inheritdoc
     */
    async ngAfterViewInit(): Promise<void> {
        const ionItem = this.getParentIonItem();

        ionItem && await this.updateIonItemStyles(ionItem);
    }

    /**
     * Emit click event.
     *
     * @param event Event.
     */
    emitClick(event: Event): void {
        this.onClick.emit(event);
    }

    /**
     * Get parent ion-item element, if any.
     *
     * @param element Child element, defaults to the component's root element.
     * @returns Parent ion-item element.
     */
    protected getParentIonItem(element?: HTMLElement): HTMLElement | undefined {
        element = element ?? this.elementRef.nativeElement;

        if (!element.parentElement) {
            return;
        }

        if (element.parentElement.tagName.toLowerCase() === 'ion-item') {
            return element.parentElement;
        }

        return this.getParentIonItem(element.parentElement);
    }

    /**
     * Updates the styles of an ion-item to make it compatible with hosting a background button.
     *
     * @param ionItem ion-item element.
     */
    protected async updateIonItemStyles(ionItem: HTMLElement): Promise<void> {
        if (!ionItem) {
            return;
        }

        const innerWrapper = await CoreUtils.waitFor(() => ionItem.shadowRoot?.querySelector<HTMLElement>('.item-inner'));

        innerWrapper.style.position = 'static';

        Array.from(innerWrapper.children).forEach(child =>  {
            if (!(child instanceof HTMLElement) || child.classList.contains('input-wrapper')) {
                return;
            }

            this.raise(child);
        });
    }

    /**
     * Raise an element above the clickable background.
     *
     * @param element Element to raise.
     */
    protected raise(element: HTMLElement): void {
        if (element instanceof HTMLSlotElement) {
            element.assignedElements().forEach(child => {
                if (!(child instanceof HTMLElement)) {
                    return;
                }

                this.raise(child);
            });

            return;
        }

        // Set z-index to 10, instead of 1, because there are already some elements with an elevated z-index in ion-items.
        element.style.zIndex = '10';
    }

}
