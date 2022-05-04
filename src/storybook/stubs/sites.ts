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

import school from '@/storybook/fixtures/sites/school.json';
import { CoreSite } from '@classes/site';
import { CoreSitesProvider } from '@services/sites';

/**
 * Sites provider stub.
 */
export class CoreSitesProviderStub extends CoreSitesProvider {

    /**
     * @inheritdoc
     */
    getCurrentSite(): CoreSite | undefined {
        this.stubCurrentSite();

        return super.getCurrentSite();
    }

    /**
     * @inheritdoc
     */
    getRequiredCurrentSite(): CoreSite {
        this.stubCurrentSite();

        return super.getRequiredCurrentSite();
    }

    /**
     * Stub instance of the current site.
     */
    private stubCurrentSite(): void {
        if (this.currentSite) {
            return;
        }

        this.currentSite = new CoreSite(school.id, school.info.siteurl, undefined, school.info);
    }

}
