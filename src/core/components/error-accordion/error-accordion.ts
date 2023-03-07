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

import { Component, ElementRef, Input, OnChanges, OnInit } from '@angular/core';
import { Translate } from '@singletons';
import { CoreForms } from '@singletons/form';
import ChevronUpSVG from '!raw-loader!ionicons/dist/svg/chevron-up.svg';
import ChevronDownSVG from '!raw-loader!ionicons/dist/svg/chevron-down.svg';

/**
 * Component to show error details.
 *
 * Given that this component has to be injected dynamically in some situations (for example, error alerts),
 * it can be rendered using the static render() method to get the raw HTML.
 */
@Component({
    selector: 'core-error-accordion',
    templateUrl: 'core-error-accordion.html',
    styleUrls: ['error-accordion.scss'],
})
export class CoreErrorAccordionComponent implements OnInit, OnChanges {

    /**
     * Render an instance of the component into an HTML string.
     *
     * @param errorCode Error code.
     * @param errorDetails Error details.
     * @returns Component HTML.
     */
    static render(errorCode: string, errorDetails: string): string {
        const toggleId = CoreForms.uniqueId('error-accordion-toggle');
        const errorCodeLabel = Translate.instant('core.errorcode', { errorCode });
        const hideDetailsLabel = Translate.instant('core.errordetailshide');
        const showDetailsLabel = Translate.instant('core.errordetailsshow');

        return `
            <div class="core-error-accordion">
                <input id="${toggleId}" type="checkbox" class="core-error-accordion--checkbox" />
                <h2 class="core-error-accordion--code">${errorCodeLabel}</h2>
                <p class="core-error-accordion--details">${errorDetails}</p>
                <label for="${toggleId}" class="core-error-accordion--toggle">
                    <div class="core-error-accordion--hide-details">
                        ${hideDetailsLabel}
                        ${ChevronUpSVG}
                    </div>
                    <div class="core-error-accordion--show-details">
                        ${showDetailsLabel}
                        ${ChevronDownSVG}
                    </div>
                </label>
            </div>
        `;
    }

    @Input() errorCode!: string;
    @Input() errorDetails!: string;

    constructor(private element: ElementRef) {}

    /**
     * @inheritdoc
     */
    ngOnInit(): void {
        this.render();
    }

    /**
     * @inheritdoc
     */
    ngOnChanges(): void {
        this.render();
    }

    /**
     * Render component html in the element created by Angular.
     */
    private render(): void {
        this.element.nativeElement.innerHTML = CoreErrorAccordionComponent.render(this.errorCode, this.errorDetails);
    }

}
