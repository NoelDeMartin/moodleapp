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

import type { CoreAppProvider } from '@services/app';
import { CoreApp } from '@services/app';
import type { CoreConfigProvider } from '@services/config';
import { CoreConfig } from '@services/config';
import type { CoreDbProvider } from '@services/db';
import { CoreDB } from '@services/db';
import type { CoreCustomURLSchemesProvider } from '@services/urlschemes';
import { CoreCustomURLSchemes } from '@services/urlschemes';
import { CoreConstants } from '../constants';

type DevelopmentWindow = Window & {
    appProvider?: CoreAppProvider;
    configProvider?: CoreConfigProvider;
    dbProvider?: CoreDbProvider;
    urlSchemes?: CoreCustomURLSchemesProvider;
};

function initializeDevelopmentWindow(window: DevelopmentWindow) {
    window.appProvider = CoreApp.instance;
    window.configProvider = CoreConfig.instance;
    window.dbProvider = CoreDB.instance;
    window.urlSchemes = CoreCustomURLSchemes.instance;
}

export default function(): void {
    if (!CoreConstants.enableDevTools()) {
        return;
    }

    initializeDevelopmentWindow(window);
}
