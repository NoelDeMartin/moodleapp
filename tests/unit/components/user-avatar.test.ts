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

import { CoreUserAvatarComponent } from '@components/user-avatar/user-avatar';

import { CoreAppProvider } from '@providers/app';
import { CoreEventsProvider } from '@providers/events';
import { CoreSitesProvider } from '@providers/sites';
import { CoreUtilsProvider } from '@providers/utils/utils';
import { NavController } from 'ionic-angular';
import CoreExternalContentDirectiveStub from '@testing/stubs/directives/CoreExternalContent';
import TestCase from '@testing/ComponentTestCase';
import TranslatePipeStub from '@testing/stubs/pipes/Translate';

const test = new TestCase(CoreUserAvatarComponent, {
    services: [
        CoreSitesProvider,
        CoreUtilsProvider,
        CoreAppProvider,
        CoreEventsProvider,
    ],
});

describe('CoreUserAvatarComponent', () => {

    beforeEach(() => {
        test.configureTestingModule({
            declarations: [
                CoreExternalContentDirectiveStub,
                TranslatePipeStub,
            ],
            providers: [
                NavController,
            ],
        });
    });

    it('should render', () => {
        const element = test.render();

        expect(element.innerHTML.trim()).not.toHaveLength(0);
        expect(element.querySelector('img').src).toEqual(document.location.href + 'assets/img/user-avatar.png');
    });

});
