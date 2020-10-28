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

import { Component, HostListener } from '@angular/core';
import { IonTabs, NavController } from '@ionic/angular';
import { StackEvent } from '@ionic/angular/directives/navigation/stack-utils';

@Component({
    selector: 'core-tabs',
    templateUrl: 'core-tabs.html',
    styleUrls: ['tabs.scss'],
})
export class CoreTabsComponent extends IonTabs {

    constructor(private myNavCtrl: NavController) {
        super(myNavCtrl);
    }

    onPageSelected(detail: StackEvent): void {
        let stackId = detail.enteringView.stackId;

        if (stackId === '') {
            stackId = 'home';
        }

        if (detail.tabSwitch && stackId !== undefined) {
            if (this.tabBar) {
                this.tabBar.selectedTab = stackId;
            }
            this.ionTabsWillChange.emit({ tab: stackId });
            this.ionTabsDidChange.emit({ tab: stackId });
        }
    }

    /**
     * @inheritdocs
     */
    @HostListener('ionTabButtonClick', ['$event.detail.tab'])
    select(tab: string): Promise<boolean> {
        const alreadySelected = this.outlet.getActiveStackId() === tab;

        if (tab === 'home') {
            tab = '';
        }

        const tabRootUrl = `${this.outlet.tabsPrefix}/${tab}`;
        if (alreadySelected) {
            const activeStackId = this.outlet.getActiveStackId();
            const activeView = this.outlet.getLastRouteView(activeStackId);

            // If on root tab, do not navigate to root tab again
            if (activeView?.url === tabRootUrl) {
                return Promise.resolve(false);
            }

            const rootView = this.outlet.getRootView(tab);
            const navigationExtras = rootView && tabRootUrl === rootView.url && rootView.savedExtras;

            return this.myNavCtrl.navigateRoot(tabRootUrl, {
                ...(navigationExtras),
                animated: true,
                animationDirection: 'back',
            });
        } else {
            const lastRoute = this.outlet.getLastRouteView(tab);
            /**
             * If there is a lastRoute, goto that, otherwise goto the fallback url of the
             * selected tab
             */
            const url = lastRoute && lastRoute.url || tabRootUrl;
            const navigationExtras = lastRoute && lastRoute.savedExtras;

            return this.myNavCtrl.navigateRoot(url, {
                ...(navigationExtras),
                animated: true,
                animationDirection: 'back',
            });
        }
    }

}
