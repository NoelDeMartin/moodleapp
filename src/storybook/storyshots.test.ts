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

import initStoryshots from '@storybook/addon-storyshots';
import { imageSnapshot, ImageSnapshotConfig } from '@storybook/addon-storyshots-puppeteer';

const getMatchOptions: ImageSnapshotConfig['getMatchOptions'] = () => ({
    failureThreshold: 0.1,
    failureThresholdType: 'percent',
});
const getScreenshotOptions: ImageSnapshotConfig['getScreenshotOptions']  = ({ context: { kind } }) => ({
    clip: kind.includes('Avatar')
        ? {
            x: 0,
            y: 0,
            width: 100,
            height: 100,
        }
        : {
            x: 0,
            y: 0,
            width: 600,
            height: 150,
        },
});

initStoryshots({ suite: 'HTML storyshots' });
initStoryshots({ suite: 'Image storyshots', test: imageSnapshot({ getMatchOptions, getScreenshotOptions }) });
