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

const { readdirSync, readFileSync } = require('fs');

if (process.argv.length < 3) {
    console.error('Missing required performance dumps path argument');
    process.exit(1);
}

const performanceDumpsPath = process.argv[2].trimRight('/') + '/';
const files = readdirSync(performanceDumpsPath);

const measures = {};

for (const file of files) {
    const performanceLogs = JSON.parse(readFileSync(performanceDumpsPath + file));

    for (const [measure, timings] of Object.entries(performanceLogs)) {
        measures[measure] = measures[measure] ?? [];
        measures[measure].push(timings.total);
    }
}

for (const [measure, times] of Object.entries(measures)) {
    const totalRuns = times.length;
    const averageTime = Math.round(times.reduce((total, time) => total + time) / totalRuns);

    console.log(`${measure} took an average of ${averageTime}ms (in ${totalRuns} runs)`);
}
