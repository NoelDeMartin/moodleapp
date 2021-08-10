#!/usr/bin/env node

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

const { readFileSync, writeFileSync } = require('fs');
const { resolve } = require('path');

function fixCordovaModule() {
    const bundlePath = resolve(__dirname, '../www/index.js');
    const bundle = readFileSync(bundlePath).toString();

    writeFileSync(bundlePath, bundle.replace('window.CORDOVA_MODULE', 'module'));
}

function onBuild(error) {
    if (error) {
        console.error('build failed! ', error);

        return;
    }

    fixCordovaModule();

    console.log('build succeeded');
}

const options = {
    entryPoints: ['cordova/cordova-plugin-moodleapp/src/ts/index.ts'],
    tsconfig: 'cordova/cordova-plugin-moodleapp/tsconfig.json',
    outdir: 'cordova/cordova-plugin-moodleapp/www',
    minify: process.env.NODE_ENV === 'production',
    bundle: true,
};

if (process.argv.includes('--watch')) {
    options.watch = { onRebuild: onBuild };
}

require('esbuild')
    .build(options)
    .then(() => onBuild())
    .catch(error => onBuild(error));
