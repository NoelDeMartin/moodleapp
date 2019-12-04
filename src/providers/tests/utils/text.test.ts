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

import { CoreTextUtilsProvider } from '@providers/utils/text';

describe('CoreTextUtilsProvider', () => {

    let textUtils: CoreTextUtilsProvider;

    beforeEach(() => {
        textUtils = new CoreTextUtilsProvider(
            jest.fn() as any,
            jest.fn() as any,
            jest.fn() as any,
            jest.fn() as any,
            jest.fn() as any,
        );
    });

    it('adds ending slashes', async () => {
        const originalUrl = 'https://moodle.org';

        const url = textUtils.addEndingSlash(originalUrl);

        expect(url).toEqual('https://moodle.org/');
    });

    it('doesn\'t add duplicated ending slashes', async () => {
        const originalUrl = 'https://moodle.org/';

        const url = textUtils.addEndingSlash(originalUrl);

        expect(url).toEqual('https://moodle.org/');
    });

});
