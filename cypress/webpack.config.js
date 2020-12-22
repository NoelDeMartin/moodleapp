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

const { resolve } = require('path');

module.exports = {
    resolve: {
        extensions: ['.ts', '.js'],
        alias: {
            '@': resolve(__dirname, '../src'),
            '@classes': resolve(__dirname, '../src/core/classes'),
            '@components': resolve(__dirname, '../src/core/components'),
            '@cy': __dirname,
            '@directives': resolve(__dirname, '../src/core/directives'),
            '@features': resolve(__dirname, '../src/core/features'),
            '@guards': resolve(__dirname, '../src/core/guards'),
            '@pipes': resolve(__dirname, '../src/core/pipes'),
            '@services': resolve(__dirname, '../src/core/services'),
            '@singletons': resolve(__dirname, '../src/core/singletons'),
        },
    },
    module: {
        rules: [
            {
                test: /\.ts$/,
                exclude: [/node_modules/],
                use: [{
                    loader: 'ts-loader',
                }],
            },
        ],
    },
};
