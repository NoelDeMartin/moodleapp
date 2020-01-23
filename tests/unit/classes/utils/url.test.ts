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

    it('parses standard urls', () => {
        expect(CoreUrl.parse('https://learn.moodle.org/my/')).toEqual({
            protocol: 'https',
            domain: 'learn.moodle.org',
            path: '/my/',
        });
    });

    it('parses domains without TLD', () => {
        expect(CoreUrl.parse('ftp://localhost/nested/path')).toEqual({
            protocol: 'ftp',
            domain: 'localhost',
            path: '/nested/path',
        });
    });

    it('parses ips', () => {
        expect(CoreUrl.parse('http://192.168.1.157:8080/')).toEqual({
            protocol: 'http',
            domain: '192.168.1.157',
            port: '8080',
            path: '/',
        });
    });

    it('guesses moodle domains for common urls of instances installed on subdirectories', () => {
        expect(CoreUrl.guessMoodleDomain('https://learn.moodle.org/custom/my/'))
            .toEqual('learn.moodle.org/custom');

        expect(CoreUrl.guessMoodleDomain('https://learn.moodle.org/custom/course/view.php?id=21896'))
            .toEqual('learn.moodle.org/custom');

        expect(CoreUrl.guessMoodleDomain('https://learn.moodle.org/custom/?redirect=0'))
            .toEqual('learn.moodle.org/custom');

        expect(CoreUrl.guessMoodleDomain('https://learn.moodle.org/custom/mod/page/view.php?id=40'))
            .toEqual('learn.moodle.org/custom');

        expect(CoreUrl.guessMoodleDomain('https://learn.moodle.org/custom/index.php'))
            .toEqual('learn.moodle.org/custom');

        expect(CoreUrl.guessMoodleDomain('https://learn.moodle.org/custom/login/index.php'))
            .toEqual('learn.moodle.org/custom');

        expect(CoreUrl.guessMoodleDomain('https://learn.moodle.org/custom/mod/page/view.php?id=118874#maincontent'))
            .toEqual('learn.moodle.org/custom');
    });

    it('guesses moodle domains for arbitrary urls of instances installed on the root directory', () => {
        expect(CoreUrl.guessMoodleDomain('https://learn.moodle.org/madeup-path'))
            .toEqual('learn.moodle.org');
    });

});
