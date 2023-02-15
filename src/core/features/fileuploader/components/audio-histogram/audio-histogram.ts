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
import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, Input, OnDestroy, ViewChild } from '@angular/core';

@Component({
    selector: 'core-audio-histogram',
    templateUrl: 'audio-histogram.html',
    styleUrls: ['audio-histogram.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CoreFileUploaderAudioHistogramComponent implements AfterViewInit, OnDestroy {

    private static readonly BARS_WIDTH = 2;
    private static readonly BARS_GUTTER = 4;

    @Input() analyser!: AnalyserNode;
    @Input() paused?: boolean;
    @ViewChild('canvas') canvasRef?: ElementRef<HTMLCanvasElement>;

    private element: HTMLElement;
    private canvas?: HTMLCanvasElement;
    private context?: CanvasRenderingContext2D | null;
    private buffer?: Uint8Array;
    private destroyed = false;

    constructor({ nativeElement }: ElementRef<HTMLElement>) {
        this.element = nativeElement;
    }

    /**
     * @inheritdoc
     */
    ngAfterViewInit(): void {
        this.canvas = this.canvasRef?.nativeElement;
        this.context = this.canvas?.getContext('2d');
        this.buffer = new Uint8Array(this.analyser.fftSize);

        if (this.context) {
            const styles = getComputedStyle(this.element);

            this.context.fillStyle = styles.getPropertyValue('--background-color');
            this.context.lineCap = 'round';
            this.context.lineWidth = CoreFileUploaderAudioHistogramComponent.BARS_WIDTH;
            this.context.strokeStyle = styles.getPropertyValue('--bars-color');
        }

        this.draw();
    }

    /**
     * @inheritdoc
     */
    ngOnDestroy(): void {
        this.destroyed = true;
    }

    /**
     * Draw histogram.
     */
    private draw(): void {
        if (this.destroyed || !this.canvas || !this.context || !this.buffer) {
            return;
        }

        const width = this.canvas.width;
        const height = this.canvas.height;
        const barsWidth = CoreFileUploaderAudioHistogramComponent.BARS_WIDTH;
        const barsGutter = CoreFileUploaderAudioHistogramComponent.BARS_GUTTER;
        const chunkLength = Math.floor(this.buffer.length / ((width - barsWidth - 1) / (barsWidth + barsGutter)));
        const barsCount = Math.floor(this.buffer.length / chunkLength);

        // Reset canvas.
        this.context.fillRect(0, 0, width, height);

        // Draw bars.
        const startX = Math.floor((width - (barsWidth + barsGutter)*barsCount - barsWidth - 1)/2);

        this.context.beginPath();
        this.paused ? this.drawPausedBars(startX) : this.drawActiveBars(startX);
        this.context.stroke();

        // Schedule next frame.
        requestAnimationFrame(() => this.draw());
    }

    /**
     * Draws bars on the histogram when it is active.
     *
     * @param x Starting x position.
     */
    private drawActiveBars(x: number): void {
        if (!this.canvas || !this.buffer) {
            return;
        }

        let levels: number[] = [];
        const width = this.canvas.width;
        const halfHeight = this.canvas.height / 2;
        const barsWidth = CoreFileUploaderAudioHistogramComponent.BARS_WIDTH;
        const barsGutter = CoreFileUploaderAudioHistogramComponent.BARS_GUTTER;
        const chunkLength = Math.floor(this.buffer.length / ((width - barsWidth - 1) / (barsWidth + barsGutter)));
        const drawBar = (x: number, levels: number[]) => {
            const level = Math.abs(Math.max(4, levels.reduce((total, level) => total + level, 0) / levels.length));

            this.context?.moveTo(x, halfHeight - level);
            this.context?.lineTo(x, halfHeight + level);
        };

        this.analyser.getByteTimeDomainData(this.buffer);

        for (let i = 0; i < this.buffer.length; i++) {
            levels.push((halfHeight * (1 - (this.buffer[i] / 128))));

            if (levels.length < chunkLength) {
                continue;
            }

            drawBar(x, levels);

            x += barsWidth + barsGutter;
            levels = [];
        }

        drawBar(x, levels);
    }

    /**
     * Draws bars on the histogram when it is paused.
     *
     * @param x Starting x position.
     */
    private drawPausedBars(x: number): void {
        if (!this.canvas || !this.context) {
            return;
        }

        const width = this.canvas.width;
        const halfHeight = this.canvas.height / 2;
        const xStep = CoreFileUploaderAudioHistogramComponent.BARS_WIDTH + CoreFileUploaderAudioHistogramComponent.BARS_GUTTER;

        while (x < width) {
            this.context.moveTo(x, halfHeight - 4);
            this.context.lineTo(x, halfHeight + 4);

            x += xStep;
        }
    }

}
