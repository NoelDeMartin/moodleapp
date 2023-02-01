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

import { ChangeDetectionStrategy, Component, OnDestroy } from '@angular/core';
import { CoreFormModalComponent } from '@classes/form-modal-component';
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

@Component({
    selector: 'core-fileuploader-audio-recorder',
    styleUrls: ['./audio-recorder.scss'],
    templateUrl: 'audio-recorder.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CoreFileUploaderAudioRecorderComponent extends CoreFormModalComponent<CoreFileUploaderAudioRecording>
    implements OnDestroy {

    recorder$: BehaviorSubject<Mp3MediaRecorder | null>;
    recording$: Observable<AudioRecording | null>;
    recordingUrl$: Observable<SafeUrl | null>;
    status$: Observable<'recording' | 'done' | 'empty'>;

    protected recording: AudioRecording | null;
    protected recordingSubscription: Subscription;

    constructor() {
        super();

        this.recorder$ = new BehaviorSubject(null);
        this.recording$ = this.recorder$.pipe(recorderAudioRecording(), shareReplay());
        this.recordingUrl$ = this.recording$.pipe(
            map((recording) => recording && DomSanitizer.bypassSecurityTrustUrl(recording.url)),
        );
        this.status$ = combineLatest([this.recorder$.pipe(recorderIsRecording(), shareReplay()), this.recording$])
            .pipe(map(([isRecording, recording]) => {
                if (isRecording) {
                    return 'recording';
                };

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
    }

    /**
     * Start recording.
     */
    async startRecording(): Promise<void> {
        const recorder = await this.createRecorder();

        this.recorder$.next(recorder);

        recorder.start();
    }

    /**
     * Stop recording.
     */
    stopRecording(): void {
        this.recorder$.value?.stop();
    }

    /**
     * Discard recording.
     */
    discardRecording(): void {
        this.recorder$.next(null);
    }

    /**
     * Dismiss modal without a result.
     */
    async cancel(): Promise<void> {
        if (this.recording && await this.preventDismiss()) {
            return;
        }

        this.dismiss(new CoreCaptureError(CAPTURE_ERROR_NO_MEDIA_FILES));
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

        this.dismiss({
            name: fileEntry.name,
            fullPath: fileEntry.toURL(),
            type: 'audio/mpeg',
        });
    }

    /**
     * Create a recorder instance.
     *
     * @returns Recorder.
     */
    protected async createRecorder(): Promise<Mp3MediaRecorder> {
        await this.prepareMicrophoneAuthorization();

        const mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });

        return new Mp3MediaRecorder(mediaStream, { worker: this.startWorker() });
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
 * Observable operator that listens to a recorder and emits a recording file.
 *
 * @returns Operator.
 */
function recorderAudioRecording(): OperatorFunction<Mp3MediaRecorder | null, AudioRecording | null> {
    return source => new Observable(subscriber => {
        let audioChunks: Blob[] = [];
        let previousRecorder: Mp3MediaRecorder | null = null;
        const onDataAvailable = event => audioChunks.push(event.data);
        const onError = event => CoreDomUtils.showErrorModal(event.error);
        const onStop = () => {
            const blob = new Blob(audioChunks, { type: 'audio/mpeg' });

            subscriber.next({
                url: URL.createObjectURL(blob),
                blob,
            });
        };
        const subscription = source.subscribe(recorder => {
            previousRecorder?.removeEventListener('dataavailable', onDataAvailable);
            previousRecorder?.removeEventListener('error', onError);
            previousRecorder?.removeEventListener('stop', onStop);

            recorder?.addEventListener('dataavailable', onDataAvailable);
            recorder?.addEventListener('error', onError);
            recorder?.addEventListener('stop', onStop);

            audioChunks = [];
            previousRecorder = recorder;

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
function recorderIsRecording(): OperatorFunction<Mp3MediaRecorder | null, boolean> {
    return source => new Observable(subscriber => {
        let previousRecorder: Mp3MediaRecorder | null = null;
        const onStart = () => subscriber.next(true);
        const onStop = () => subscriber.next(false);
        const subscription = source.subscribe(recorder => {
            previousRecorder?.removeEventListener('start', onStart);
            previousRecorder?.removeEventListener('stop', onStop);

            recorder?.addEventListener('start', onStart);
            recorder?.addEventListener('stop', onStop);

            previousRecorder = recorder;

            subscriber.next(recorder?.state === 'recording');
        });

        subscriber.next(false);

        return () => {
            subscription.unsubscribe();

            previousRecorder?.removeEventListener('start', onStart);
            previousRecorder?.removeEventListener('stop', onStop);
        };
    });
}
