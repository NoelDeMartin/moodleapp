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

import { Platform } from '@singletons';
import { CoreUserToursAlignment, CoreUserToursSide } from '../services/user-tours';

const ARROW_HEIGHT = 22;
const ARROW_WIDTH = 35;
const BORDER_RADIUS = 8;
const MARGIN = 16;

export class CoreUserToursPopoverLayout {

    wrapperStyles: Record<string, number | string>;
    wrapperInlineStyles!: string;
    wrapperArrowStyles: Record<string, number | string>;
    wrapperArrowInlineStyles!: string;

    private targetBoundingBox: DOMRect;
    private side: CoreUserToursSide;
    private alignment: CoreUserToursAlignment;

    constructor(target: HTMLElement, side: CoreUserToursSide, alignment: CoreUserToursAlignment) {
        this.targetBoundingBox = target.getBoundingClientRect();
        this.side = side;
        this.alignment = alignment;
        this.wrapperArrowStyles = {};
        this.wrapperStyles = {};

        this.calculateInlineStyles();
    }

    private calculateInlineStyles(): void {
        const sideHandlers: Record<CoreUserToursSide, () => void> = {
            [CoreUserToursSide.Top]: this.calculateWrapperTopSideStyles,
            [CoreUserToursSide.Bottom]: this.calculateWrapperBottomSideStyles,
            [CoreUserToursSide.Right]: this.calculateWrapperRightSideStyles,
            [CoreUserToursSide.Left]: this.calculateWrapperLeftSideStyles,
            [CoreUserToursSide.Start]: Platform.isRTL ? this.calculateWrapperRightSideStyles : this.calculateWrapperLeftSideStyles,
            [CoreUserToursSide.End]: Platform.isRTL ? this.calculateWrapperLeftSideStyles : this.calculateWrapperRightSideStyles,
        };

        sideHandlers[this.side].call(this);

        this.wrapperInlineStyles = this.renderStyles(this.wrapperStyles);
        this.wrapperArrowInlineStyles = this.renderStyles(this.wrapperArrowStyles);
    }

    private calculateWrapperHorizontalAlignmentStyles(): void {
        const horizontallAlignmentHandlers: Record<CoreUserToursAlignment, () => void> ={
            [CoreUserToursAlignment.Start]: Platform.isRTL
                ? this.calculateWrapperRightAlignmentStyles
                : this.calculateWrapperLeftAlignmentStyles,
            [CoreUserToursAlignment.Center]: this.calculateWrapperCenterHorizontalAlignmentStyles,
            [CoreUserToursAlignment.End]: Platform.isRTL
                ? this.calculateWrapperLeftAlignmentStyles
                : this.calculateWrapperRightAlignmentStyles,
        };

        horizontallAlignmentHandlers[this.alignment].call(this);
    }

    private calculateWrapperVerticalAlignmentStyles(): void {
        const verticalAlignmentHandlers: Record<CoreUserToursAlignment, () => void> ={
            [CoreUserToursAlignment.Start]: this.calculateWrapperTopAlignmentStyles,
            [CoreUserToursAlignment.Center]: this.calculateWrapperCenterVerticalAlignmentStyles,
            [CoreUserToursAlignment.End]: this.calculateWrapperBottomAlignmentStyles,
        };

        verticalAlignmentHandlers[this.alignment].call(this);
    }

    private calculateWrapperArrowHorizontalStyles(): void {
        this.wrapperArrowStyles['border-width'] = `${ARROW_WIDTH / 2}px ${ARROW_HEIGHT}px`;
    }

    private calculateWrapperArrowVerticalStyles(): void {
        this.wrapperArrowStyles['border-width'] = `${ARROW_HEIGHT}px ${ARROW_WIDTH / 2}px`;
    }

    private calculateWrapperTopSideStyles(): void {
        this.wrapperStyles.bottom = window.innerHeight - this.targetBoundingBox.y + ARROW_HEIGHT + MARGIN;
        this.wrapperArrowStyles.bottom = -ARROW_HEIGHT*2;
        this.wrapperArrowStyles['border-top-color'] = 'white';

        this.calculateWrapperArrowVerticalStyles();
        this.calculateWrapperHorizontalAlignmentStyles();
    }

    private calculateWrapperBottomSideStyles(): void {
        this.wrapperStyles.top = this.targetBoundingBox.y + this.targetBoundingBox.height + ARROW_HEIGHT + MARGIN;
        this.wrapperArrowStyles.top = -ARROW_HEIGHT*2;
        this.wrapperArrowStyles['border-bottom-color'] = 'white';

        this.calculateWrapperArrowVerticalStyles();
        this.calculateWrapperHorizontalAlignmentStyles();
    }

    private calculateWrapperRightSideStyles(): void {
        this.wrapperStyles.left = this.targetBoundingBox.x + this.targetBoundingBox.width + ARROW_HEIGHT + MARGIN;
        this.wrapperArrowStyles.left = -ARROW_HEIGHT*2;
        this.wrapperArrowStyles['border-right-color'] = 'white';

        this.calculateWrapperArrowHorizontalStyles();
        this.calculateWrapperVerticalAlignmentStyles();
    }

    private calculateWrapperLeftSideStyles(): void {
        this.wrapperStyles.right = window.innerWidth - this.targetBoundingBox.x + ARROW_HEIGHT + MARGIN;
        this.wrapperArrowStyles.right = -ARROW_HEIGHT*2;
        this.wrapperArrowStyles['border-left-color'] = 'white';

        this.calculateWrapperArrowHorizontalStyles();
        this.calculateWrapperVerticalAlignmentStyles();
    }

    private calculateWrapperTopAlignmentStyles() {
        this.wrapperStyles.top = this.targetBoundingBox.y;
        this.wrapperArrowStyles.top = BORDER_RADIUS;
    }

    private calculateWrapperBottomAlignmentStyles(): void {
        this.wrapperStyles.bottom = window.innerHeight - this.targetBoundingBox.y - this.targetBoundingBox.height;
        this.wrapperArrowStyles.bottom = BORDER_RADIUS;
    }

    private calculateWrapperRightAlignmentStyles() {
        this.wrapperStyles.right = window.innerWidth - this.targetBoundingBox.x - this.targetBoundingBox.width;
        this.wrapperArrowStyles.right = BORDER_RADIUS;
    }

    private calculateWrapperLeftAlignmentStyles() {
        this.wrapperStyles.left = this.targetBoundingBox.x;
        this.wrapperArrowStyles.left = BORDER_RADIUS;
    }

    private calculateWrapperCenterHorizontalAlignmentStyles() {
        this.wrapperStyles.left = this.targetBoundingBox.x + this.targetBoundingBox.width / 2;
        this.wrapperStyles.transform = 'translateX(-50%)';
        this.wrapperArrowStyles.left = '50%';
        this.wrapperArrowStyles.transform = 'translateX(-50%)';
    }

    private calculateWrapperCenterVerticalAlignmentStyles() {
        this.wrapperStyles.top = this.targetBoundingBox.y + this.targetBoundingBox.height / 2;
        this.wrapperStyles.transform = 'translateY(-50%)';
        this.wrapperArrowStyles.top = '50%';
        this.wrapperArrowStyles.transform = 'translateY(-50%)';
    }

    private renderStyles(styles: Record<string, number | string>): string {
        return Object
            .entries(styles)
            .reduce((renderedStyles, [property, value]) => {
                const propertyValue = typeof value === 'string' ? value : `${value}px`;

                return `${property}:${propertyValue};${renderedStyles}`;
            }, '');
    }

}
