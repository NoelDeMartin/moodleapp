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

import { CoreUrl } from '@classes/utils/url';

describe('CoreUrl', () => {

    it('parses urls', () => {
        expect(CoreUrl.parse('http://moodle.org/my/')).toEqual({
            protocol: 'http',
            domain: 'moodle.org',
            path: '/my/',
        });

        expect(CoreUrl.parse('https://moodle.org')).toEqual({
            protocol: 'https',
            domain: 'moodle.org',
        });
    });

    it('parses urls with implicit domains', () => {
        expect(CoreUrl.parse('moodle.org/my/', 'http')).toEqual({
            protocol: 'http',
            domain: 'moodle.org',
            path: '/my/',
        });

        expect(CoreUrl.parse('moodle.org', 'https')).toEqual({
            protocol: 'https',
            domain: 'moodle.org',
        });
    });

});
