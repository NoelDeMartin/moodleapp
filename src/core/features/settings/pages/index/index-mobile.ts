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

import { Component } from '@angular/core';
import { CoreNavigator } from '@services/navigator';
import { CoreSettingsConstants, CoreSettingsSection } from '@features/settings/constants';

@Component({
    selector: 'page-core-settings-index-mobile',
    templateUrl: 'index-mobile.html',
})
export class CoreSettingsIndexMobilePage {

    sections = CoreSettingsConstants.SECTIONS;

    /**
     * Open a section page.
     *
     * @param section Section to open.
     */
    openSection(section: CoreSettingsSection): void {
        CoreNavigator.instance.navigate(`./${section.path}`);
    }

}
