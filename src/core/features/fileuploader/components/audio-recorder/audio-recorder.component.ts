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

import { ChangeDetectionStrategy, Component, ElementRef, NgModule, OnDestroy } from '@angular/core';
import { CoreModalComponent } from '@classes/modal-component';
import { CorePlatform } from '@services/platform';
import { Diagnostic, DomSanitizer, Translate } from '@singletons';
import { BehaviorSubject, combineLatest, Observable, OperatorFunction, Subscription } from 'rxjs';
import { Mp3MediaRecorder } from 'mp3-mediarecorder';
import { map, shareReplay } from 'rxjs/operators';
import { initAudioEncoderMessage } from '@features/fileuploader/utils/worker-messages';
import { SafeUrl } from '@angular/platform-browser';
import { CoreDomUtils } from '@services/utils/dom';
import { CAPTURE_ERROR_NO_MEDIA_FILES, CoreCaptureError } from '@classes/errors/captureerror';
import { CoreFileUploaderAudioRecording } from '@features/fileuploader/services/fileuploader';
import { CoreFile, CoreFileProvider } from '@services/file';
import { CorePath } from '@singletons/path';
import { CoreSharedModule } from '@/core/shared.module';
import { CoreFileUploaderAudioHistogramComponent } from '@features/fileuploader/components/audio-histogram/audio-histogram';

@Component({
    selector: 'core-fileuploader-audio-recorder',
    styleUrls: ['./audio-recorder.scss'],
    templateUrl: 'audio-recorder.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CoreFileUploaderAudioRecorderComponent extends CoreModalComponent<CoreFileUploaderAudioRecording>
    implements OnDestroy {

    media$: BehaviorSubject<AudioRecorderMedia | null>;
    recording$: Observable<AudioRecording | null>;
    recordingUrl$: Observable<SafeUrl | null>;
    histogramAnalyzer$: Observable<AnalyserNode | null>;
    status$: Observable<'recording-ongoing' | 'recording-paused' | 'done' | 'empty'>;

    protected recording: AudioRecording | null;
    protected recordingSubscription: Subscription;

    constructor(elementRef: ElementRef<HTMLElement>) {
        super(elementRef);

        this.media$ = new BehaviorSubject(null);
        this.recording$ = this.media$.pipe(recorderAudioRecording(), shareReplay());
        this.recordingUrl$ = this.recording$.pipe(
            map((recording) => recording && DomSanitizer.bypassSecurityTrustUrl(recording.url)),
        );
        this.histogramAnalyzer$ = this.media$.pipe(map(media => {
            if (!media?.analyser || CorePlatform.prefersReducedMotion()) {
                return null;
            }

            return media.analyser;
        }));
        this.status$ = combineLatest([this.media$.pipe(recorderStatus(), shareReplay()), this.recording$])
            .pipe(map(([recordingStatus, recording]) => {
                if (recordingStatus === 'recording') {
                    return 'recording-ongoing';
                }

                if (recordingStatus === 'paused') {
                    return 'recording-paused';
                }

                if (recording) {
                    return 'done';
                }

                return 'empty';
            }));

        this.recording = null;
        this.recordingSubscription = this.recording$.subscribe(recording => this.recording = recording);
    }

    /**
     * @inheritdoc
     */
    ngOnDestroy(): void {
        this.recordingSubscription.unsubscribe();
        this.media$.value?.recorder.stop();
    }

    /**
     * Start recording.
     */
    async startRecording(): Promise<void> {
        const media = await this.createMedia();

        this.media$.next(media);

        media.recorder.start();
    }

    /**
     * Stop recording.
     */
    stopRecording(): void {
        this.media$.value?.recorder.stop();
    }

    /**
     * Stop recording.
     */
    pauseRecording(): void {
        this.media$.value?.recorder.pause();
    }

    /**
     * Stop recording.
     */
    resumeRecording(): void {
        this.media$.value?.recorder.resume();
    }

    /**
     * Discard recording.
     */
    discardRecording(): void {
        this.media$.next(null);
    }

    /**
     * Dismiss modal without a result.
     */
    async cancel(): Promise<void> {
        if (this.recording && await this.preventDismiss()) {
            return;
        }

        this.close(new CoreCaptureError(CAPTURE_ERROR_NO_MEDIA_FILES));
    }

    /**
     * Dismiss the modal with the current recording as a result.
     */
    async submit(): Promise<void> {
        if (!this.recording) {
            return;
        }

        const fileName = await CoreFile.getUniqueNameInFolder(CoreFileProvider.TMPFOLDER, 'recording.mp3');
        const filePath = CorePath.concatenatePaths(CoreFileProvider.TMPFOLDER, fileName);
        const fileEntry = await CoreFile.writeFile(filePath, this.recording.blob);

        this.close({
            name: fileEntry.name,
            fullPath: fileEntry.toURL(),
            type: 'audio/mpeg',
        });
    }

    /**
     * Create media instances.
     *
     * @returns Media instances.
     */
    protected async createMedia(): Promise<AudioRecorderMedia> {
        await this.prepareMicrophoneAuthorization();

        const mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const audioContext = new window.AudioContext();
        const source = audioContext.createMediaStreamSource(mediaStream);
        const analyser = audioContext.createAnalyser();

        analyser.fftSize = 2048;
        source.connect(analyser);

        return {
            analyser,
            recorder: new Mp3MediaRecorder(mediaStream, { worker: this.startWorker(), audioContext }),
        };
    }

    /**
     * Make sure that microphone usage has been authorized.
     */
    protected async prepareMicrophoneAuthorization(): Promise<void> {
        if (!CorePlatform.isMobile()) {
            return;
        }

        const status = await Diagnostic.requestMicrophoneAuthorization();

        switch (status) {
            case Diagnostic.permissionStatus.DENIED_ONCE:
            case Diagnostic.permissionStatus.DENIED_ALWAYS:
                throw new Error(Translate.instant('core.fileuploader.microphonepermissiondenied'));
            case Diagnostic.permissionStatus.RESTRICTED:
                throw new Error(Translate.instant('core.fileuploader.microphonepermissionrestricted'));
        }
    }

    /**
     * Start worker script.
     *
     * @returns Worker.
     */
    protected startWorker(): Worker {
        const worker = new Worker('./audio-recorder.worker', { type: 'module' });

        worker.postMessage(
            initAudioEncoderMessage({ vmsgWasmUrl: `${document.head.baseURI}assets/lib/vmsg/vmsg.wasm` }),
        );

        return worker;
    }

    /**
     * Check whether to prevent dismissing the modal.
     *
     * @returns Whether to dismiss the modal.
     */
    protected async preventDismiss(): Promise<boolean> {
        try {
            await CoreDomUtils.showConfirm(Translate.instant('core.confirmcanceledit'));

            return false;
        } catch {
            return true;
        }
    }

}

/**
 * Audio recording data.
 */
interface AudioRecording {
    url: string;
    blob: Blob;
}

/**
 * Native media instances.
 */
interface AudioRecorderMedia {
    recorder: Mp3MediaRecorder;
    analyser: AnalyserNode;
}

/**
 * Observable operator that listens to a recorder and emits a recording file.
 *
 * @returns Operator.
 */
function recorderAudioRecording(): OperatorFunction<AudioRecorderMedia | null, AudioRecording | null> {
    return source => new Observable(subscriber => {
        let audioChunks: Blob[] = [];
        let previousRecorder: Mp3MediaRecorder | undefined;
        const onDataAvailable = event => audioChunks.push(event.data);
        const onError = event => CoreDomUtils.showErrorModal(event.error);
        const onStop = () => {
            const blob = new Blob(audioChunks, { type: 'audio/mpeg' });

            subscriber.next({
                url: URL.createObjectURL(blob),
                blob,
            });
        };
        const subscription = source.subscribe(media => {
            previousRecorder?.removeEventListener('dataavailable', onDataAvailable);
            previousRecorder?.removeEventListener('error', onError);
            previousRecorder?.removeEventListener('stop', onStop);

            media?.recorder.addEventListener('dataavailable', onDataAvailable);
            media?.recorder.addEventListener('error', onError);
            media?.recorder.addEventListener('stop', onStop);

            audioChunks = [];
            previousRecorder = media?.recorder;

            subscriber.next(null);
        });

        subscriber.next(null);

        return () => {
            subscription.unsubscribe();

            previousRecorder?.removeEventListener('dataavailable', onDataAvailable);
            previousRecorder?.removeEventListener('error', onError);
            previousRecorder?.removeEventListener('stop', onStop);
        };
    });
}

/**
 * Observable operator that listens to a recorder and emits its recording status.
 *
 * @returns Operator.
 */
function recorderStatus(): OperatorFunction<AudioRecorderMedia | null, RecordingState> {
    return source => new Observable(subscriber => {
        let previousRecorder: Mp3MediaRecorder | undefined;
        const onStart = () => subscriber.next('recording');
        const onPause = () => subscriber.next('paused');
        const onResume = () => subscriber.next('recording');
        const onStop = () => subscriber.next('inactive');
        const subscription = source.subscribe(media => {
            previousRecorder?.removeEventListener('start', onStart);
            previousRecorder?.removeEventListener('pause', onPause);
            previousRecorder?.removeEventListener('resume', onResume);
            previousRecorder?.removeEventListener('stop', onStop);

            media?.recorder.addEventListener('start', onStart);
            media?.recorder.addEventListener('pause', onPause);
            media?.recorder.addEventListener('resume', onResume);
            media?.recorder.addEventListener('stop', onStop);

            previousRecorder = media?.recorder;

            subscriber.next(media?.recorder.state ?? 'inactive');
        });

        subscriber.next('inactive');

        return () => {
            subscription.unsubscribe();

            previousRecorder?.removeEventListener('start', onStart);
            previousRecorder?.removeEventListener('pause', onPause);
            previousRecorder?.removeEventListener('resume', onResume);
            previousRecorder?.removeEventListener('stop', onStop);
        };
    });
}

@NgModule({
    imports: [CoreSharedModule],
    declarations: [
        CoreFileUploaderAudioRecorderComponent,
        CoreFileUploaderAudioHistogramComponent,
    ],
    entryComponents: [CoreFileUploaderAudioRecorderComponent],
})
export class CoreFileUploaderAudioRecorderComponentModule {}
