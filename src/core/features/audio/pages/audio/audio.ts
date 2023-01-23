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

import { Component } from '@angular/core';
import { SafeUrl } from '@angular/platform-browser';
import { initEncoderMessage } from '@features/audio/utils/worker-messages';
import { CorePlatform } from '@services/platform';
import { Diagnostic, DomSanitizer } from '@singletons';
import { Mp3MediaRecorder } from 'mp3-mediarecorder';

// TODO mp3-mediarecorder lib uses spread operator

@Component({
    selector: 'core-page-audio',
    templateUrl: 'audio.html',
    styleUrls: ['audio.scss'],
})
export class CoreAudioPage {

    audioUrl?: SafeUrl;
    private recorder?: Mp3MediaRecorder;
    private mediaStream?: MediaStream;
    private audioChunks: Blob[] = [];

    get isRecording(): boolean {
        return !!this.recorder;
    }

    async startRecording(): Promise<void> {
        const mediaStream = await this.getMediaStream();

        delete this.audioUrl;

        this.recorder = new Mp3MediaRecorder(mediaStream, { worker: this.startWorker() });
        this.recorder.ondataavailable = e => this.audioChunks.push(e.data);
        this.recorder.onstop = () => this.processAudioChunks();
        this.recorder.start();
    }

    stopRecording(): void {
        if (this.recorder?.state === 'recording') {
            this.recorder.stop();
        }

        delete this.recorder;
    }

    private async getMediaStream(): Promise<MediaStream> {
        if (!this.mediaStream) {
            try {
                if (CorePlatform.isMobile()) {
                    const status = await Diagnostic.requestMicrophoneAuthorization();

                    switch (status) {
                        case Diagnostic.permissionStatus.DENIED:
                        case Diagnostic.permissionStatus.DENIED_ONCE:
                        case Diagnostic.permissionStatus.DENIED_ALWAYS:
                            alert('Recording permission denied!!');
                            break;
                        case Diagnostic.permissionStatus.RESTRICTED:
                            alert('Recording permission restricted!!');
                            break;
                    }

                }

                this.mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
            } catch (e) {
                alert(e.message ?? 'Something went wrong getting user media');

                throw e;
            }
        }

        return this.mediaStream;
    }

    private startWorker(): Worker {
        const worker = new Worker('./audio.worker', { type: 'module' });

        worker.postMessage(
            initEncoderMessage({ vmsgWasmUrl: `${document.head.baseURI}assets/wasm/vmsg.wasm` }),
        );

        return worker;
    }

    private processAudioChunks(): void {
        const blobUrl = URL.createObjectURL(new Blob(this.audioChunks, { type: 'audio/mpeg' }));

        this.audioUrl = DomSanitizer.bypassSecurityTrustUrl(blobUrl);
        this.audioChunks = [];
    }

}
