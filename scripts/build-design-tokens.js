#!/usr/bin/env node

// (C) Copyright 2021 Moodle Pty Ltd.
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

const { readFileSync } = require('fs');

async function main() {
    const figmaJsonPath = process.argv[2] || fail('Figma json argument missing!');
    const figmaTokens = JSON.parse(readFileSync(figmaJsonPath));
    const renderedTokens = renderTokens(flattenTokens(figmaTokens, ''));

    console.log(renderedTokens);
}

function flattenTokens(tokens, prefix) {
    return Object.entries(tokens).reduce((tokens, [name, value]) => {
        if ('type' in value && 'value' in value) {
            tokens[`--mdl-${slugify(`${value['type']} ${prefix} ${name}`)}`] = value['value'];
        } else {
            Object.assign(tokens, flattenTokens(value, `${prefix} ${name}`));
        }

        return tokens;
    }, {});
}

function slugify(text) {
    return text
        .replace(/\([^)]+\)/, '')
        .trim()
        .normalize('NFD')
        .replace(/_|-/g, ' ')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^\d\w\s]/g, '')
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(new RegExp('-+', 'g'), '-');
}

function renderTokens(tokens) {
    return Object
        .entries(tokens)
        .map(([name, value]) => `${name}: ${value};`)
        .join('\n');
}

function fail(message) {
    console.error(message);
    process.exit(1);
}

main();
