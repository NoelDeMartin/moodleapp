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

import { CoreIconComponent } from '@components/icon/icon';

import ComponentTestCase from '@testing/ComponentTestCase';

const test = new ComponentTestCase(CoreIconComponent, {
    template: '<core-icon name="thumbs-up"></core-icon>',
});

describe('CoreIconComponent', () => {

    beforeEach(() => {
        test.reset();
        test.configureTestingModule();
    });

    it('should render', () => {
        const element = test.render();

        expect(element.innerHTML.trim()).not.toHaveLength(0);
        expect(element.querySelector('ion-icon').classList).toContain('ion-md-thumbs-up');
    });

});
