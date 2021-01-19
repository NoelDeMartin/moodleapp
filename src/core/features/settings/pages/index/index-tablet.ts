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

import { Component, OnDestroy, OnInit } from '@angular/core';
import { CoreNavigator } from '@services/navigator';
import { CoreSettingsConstants, CoreSettingsSection } from '@features/settings/constants';
import { CoreArray } from '@singletons/array';
import { CoreScreen, CoreScreenLayout } from '@services/screen';
import { Subscription } from 'rxjs';
import { NgZone } from '@singletons';
import { CoreMainMenuPage } from '@features/mainmenu/pages/menu/menu';

@Component({
    selector: 'page-core-settings-index-tablet',
    templateUrl: 'index-tablet.html',
    styleUrls: ['index-tablet.scss'],
})
export class CoreSettingsIndexTabletPage implements OnInit, OnDestroy {

    sections = CoreSettingsConstants.SECTIONS;
    activeSection?: string;
    layoutSubscription?: Subscription;

    /**
     * @inheritdoc
     */
    ngOnInit(): void {
        const currentSection = CoreArray.first(
            this.sections,
            section => CoreNavigator.instance.isCurrent(`**/settings/${section.path}`),
        );

        this.activeSection = currentSection?.name;

        this.layoutSubscription = CoreScreen.instance.layoutObservable.subscribe(async layout => {
            if (layout !== CoreScreenLayout.Mobile) {
                return;
            }

            await NgZone.instance.run(async () => {
                await CoreNavigator.instance.reload(CoreMainMenuPage);
                // await CoreNavigator.instance.navigate('/main/more', { animated: false });
                // await CoreNavigator.instance.navigate('/main/more/settings', { animated: false });
                // await CoreNavigator.instance.navigate('/main/more/settings/general', { animated: false });
            });
        });
    }

    ngOnDestroy(): void {
        this.layoutSubscription?.unsubscribe();
    }

    /**
     * Open a section page.
     *
     * @param section Section to open.
     */
    openSection(section: CoreSettingsSection): void {
        this.activeSection = section.name;

        CoreNavigator.instance.navigate(`../${section.path}`, { animated: false });
    }

}
