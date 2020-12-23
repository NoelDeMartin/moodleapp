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

import { CyHttpMessages } from 'cypress/types/net-stubbing';
import { parse as parseQueryString } from 'qs';

import { CoreUrl } from '@singletons/url';

export default class Interceptor {

    private urlRegExp: RegExp;
    private fixturesDomain: string;
    private webServiceResponsesCount: Record<string, number> = {};

    static interceptSiteRequests(siteUrl: string, fixturesDomain: string = 'school.moodledemo.net'): void {
        const siteDomain = CoreUrl.parse(siteUrl)!.domain!;
        const escapedSiteDomain = siteDomain.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const escapedFixturesDomain = fixturesDomain.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const urlRegExp = new RegExp(`^https?://(${escapedSiteDomain}|${escapedFixturesDomain})`);
        const instance = new Interceptor(urlRegExp, fixturesDomain);

        instance.interceptSiteRequest('/login/token.php', instance.loginToken);
        instance.interceptSiteRequest('/webservice/rest/server.php', instance.webserviceRestServer);
        cy.intercept(urlRegExp, { statusCode: 404 });
    }

    private constructor(urlRegExp: RegExp, fixturesDomain: string) {
        this.urlRegExp = urlRegExp;
        this.fixturesDomain = fixturesDomain;
        this.webServiceResponsesCount = {};
    }

    private interceptSiteRequest(
        pathname: string,
        handler: (request: CyHttpMessages.IncomingHttpRequest) => string | Record<string, unknown>,
    ): void {
        cy.intercept(
            {
                url: this.urlRegExp,
                pathname,
            },
            request => request.reply(handler.call(this, request)),
        );
    }

    private loginToken(request: CyHttpMessages.IncomingHttpRequest): Record<string, unknown> {
        const { username } = parseQueryString(request.body) as { username?: string };

        if (username === 'student') {
            return {
                token: '123456',
                privatetoken: '654321',
            };
        }

        return {
            error:'A required parameter (username) was missing',
            errorcode:'missingparam',
            stacktrace:null,
            debuginfo:null,
            reproductionlink:null,
        };
    }

    private webserviceRestServer(request: CyHttpMessages.IncomingHttpRequest): Record<string, unknown> {
        const url = new URL(request.url);
        const wsFunction = url.searchParams.get('wsfunction')!;

        if (wsFunction === 'tool_mobile_call_external_functions') {
            const { requests } = parseQueryString(request.body);

            return {
                responses: requests.map(({ function: wsFunction }) => ({
                    error: false,
                    data: JSON.stringify(this.getWebServiceResponse(wsFunction)),
                })),
            };
        } else {
            return this.getWebServiceResponse(wsFunction);
        }
    }

    private getWebServiceResponse(wsFunction: string): Record<string, unknown> {
        this.webServiceResponsesCount[wsFunction] = this.webServiceResponsesCount[wsFunction] ?? 0;

        try {
            const responseNumber = ++this.webServiceResponsesCount[wsFunction];

            return require(`@cy/fixtures/${this.fixturesDomain}/${wsFunction}_${responseNumber}.json`);
        } catch (error) {
            return require(`@cy/fixtures/${this.fixturesDomain}/${wsFunction}.json`);
        }
    }

}
