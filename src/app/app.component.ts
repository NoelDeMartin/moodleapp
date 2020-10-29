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

import { Component, OnInit } from '@angular/core';
import { NavController } from '@ionic/angular';

import { CoreLangProvider } from '@services/lang';
import { CoreEvents } from '@singletons/events';
import { CoreInit } from '@services/init';

@Component({
    selector: 'app-root',
    templateUrl: 'app.component.html',
    styleUrls: ['app.component.scss'],
})
export class AppComponent implements OnInit {

    appReady = false;

    constructor(
        protected langProvider: CoreLangProvider,
        protected navCtrl: NavController,
    ) {
    }

    /**
     * Component being initialized.
     */
    ngOnInit(): void {
        CoreEvents.on(CoreEvents.LOGOUT, () => {
            // Go to sites page when user is logged out.
            this.navCtrl.navigateRoot('/login/sites');

            // Unload lang custom strings.
            this.langProvider.clearCustomStrings();

            // Remove version classes from body.
            // @todo
            // this.removeVersionClass();
        });

        // eslint-disable-next-line promise/catch-or-return
        CoreInit.instance.ready().then(() => this.appReady = true);
    }

}
