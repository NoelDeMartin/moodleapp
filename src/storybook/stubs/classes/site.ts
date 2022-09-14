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

import { CoreSite, CoreSiteConfigResponse, CoreSiteInfo, CoreSiteWSPreSets } from '@classes/site';

export interface CoreSiteFixture {
    id: string;
    info: CoreSiteInfo;
}

export class CoreSiteStub extends CoreSite {

    protected wsStubs: Record<string, unknown> = {};

    constructor (fixture: CoreSiteFixture) {
        super(fixture.id, fixture.info.siteurl, undefined, fixture.info);

        this.stubWSResponse<CoreSiteConfigResponse>('tool_mobile_get_config', {
            settings: [],
            warnings: [],
        });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async read<T = unknown>(method: string, data: any, preSets?: CoreSiteWSPreSets): Promise<T> {
        if (method in this.wsStubs) {
            return this.wsStubs[method] as T;
        }

        return super.read(method, data, preSets);
    }

    stubWSResponse<T=unknown>(method: string, response: T): void {
        this.wsStubs[method] = response;
    }

}
