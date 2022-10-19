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

import { CoreSite, CoreSitePublicConfigResponse } from '@classes/site';
import { CoreSites } from '@services/sites';
import { CoreUtils } from '@services/utils/utils';

/**
 * Value object encapsulating the support affordances for a user.
 */
export abstract class CoreUserSupportConfig {

    public abstract canContactSupport(): boolean;

    getSupporPagetUrl(): string {
        if (!this.canContactSupport()) {
            throw new Error();
        }

        return this.guessSupportPageUrl();
    }

    protected abstract guessSupportPageUrl(): string;

}

export class CoreAuthenticatedUserSupportConfig extends CoreUserSupportConfig {

    static forCurrentSite(): CoreAuthenticatedUserSupportConfig {
        return new CoreAuthenticatedUserSupportConfig(CoreSites.getRequiredCurrentSite());
    }

    private site: CoreSite;

    constructor(site: CoreSite) {
        super();

        this.site = site;
    }

    canContactSupport(): boolean {
        return this.site.isVersionGreaterEqualThan('4.0')
            && !this.site.isFeatureDisabled('NoDelegate_CoreUserSupport');
    }

    protected guessSupportPageUrl(): string {
        return this.site.config?.supportpage?.trim()
            || `${this.site.config?.httpswwwroot ?? this.site.config?.wwwroot ?? this.site.siteUrl}/user/contactsitesupport.php`;
    }

}

export class CoreGuestUserSupportConfig extends CoreUserSupportConfig {

    static async forSite(siteUrl: string): Promise<CoreUserSupportConfig> {
        const siteConfig = await CoreUtils.ignoreErrors(CoreSites.getPublicSiteConfigByUrl(siteUrl));

        return siteConfig
            ? new CoreGuestUserSupportConfig(siteConfig)
            : new CoreNullUserSupportConfig();
    }

    private config: CoreSitePublicConfigResponse;

    constructor(config: CoreSitePublicConfigResponse) {
        super();

        this.config = config;
    }

    canContactSupport(): boolean {
        return 'supportpage' in this.config;
    }

    protected guessSupportPageUrl(): string {
        return this.config.supportpage?.trim()
            || `${this.config.httpswwwroot || this.config.wwwroot}/user/contactsitesupport.php`;
    }

}

export class CoreNullUserSupportConfig extends CoreUserSupportConfig {

    canContactSupport(): boolean {
        return false;
    }

    protected guessSupportPageUrl(): string {
        return '';
    }

}
