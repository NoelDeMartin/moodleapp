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

import { CoreConstants } from '@/core/constants';
import { asyncInstance } from '@/core/utils/async-instance';
import { InjectionToken } from '@angular/core';
import { Md5 } from 'ts-md5/dist/md5';
import { CoreError } from '@classes/errors/error';
import { CoreLogger } from '@singletons/logger';

import type { CoreSite } from '@classes/sites/site';
import type { CoreSiteInfo, CoreSitePublicConfigResponse } from '@classes/sites/unauthenticated-site';
import type { SQLiteDB, SQLiteDBTableSchema } from '@classes/sqlitedb';
import type { CoreSiteWSPreSets } from '@classes/sites/authenticated-site';
import type { CoreSitesProvider } from './sites-lazy';

export const CORE_SITE_SCHEMAS = new InjectionToken<CoreSiteSchema[]>('CORE_SITE_SCHEMAS');
export const CORE_SITE_CURRENT_SITE_ID_CONFIG = 'current_site_id';

export class EagerCoreSitesProvider {

    protected currentSite?: CoreSite;
    protected logger: CoreLogger;
    protected siteSchemas: { [name: string]: CoreRegisteredSiteSchema } = {};
    protected pluginsSiteSchemas: { [name: string]: CoreRegisteredSiteSchema } = {};

    constructor() {
        this.logger = CoreLogger.getInstance('CoreSitesProvider');
    }

    /**
     * Get the demo data for a certain "name" if it is a demo site.
     *
     * @param name Name of the site to check.
     * @returns Site data if it's a demo site, undefined otherwise.
     */
    getDemoSiteData(name: string): CoreSitesDemoSiteData | undefined {
        const demoSites = CoreConstants.CONFIG.demo_sites;
        name = name.toLowerCase();

        if (demoSites !== undefined && demoSites[name] !== undefined) {
            return demoSites[name];
        }
    }

    /**
     * Create a site ID based on site URL and username.
     *
     * @param siteUrl The site url.
     * @param username Username.
     * @returns Site ID.
     */
    createSiteID(siteUrl: string, username: string): string {
        return Md5.hashAsciiStr(siteUrl + username);
    }

    /**
     * Returns the release number from site release info.
     *
     * @param rawRelease Raw release info text.
     * @returns Release number or empty.
     */
    getReleaseNumber(rawRelease: string): string {
        const matches = rawRelease.match(/^\d+(\.\d+(\.\d+)?)?/);
        if (matches) {
            return matches[0];
        }

        return '';
    }

    /**
     * Returns the major release number from site release info.
     *
     * @param rawRelease Raw release info text.
     * @returns Major release number or empty.
     */
    getMajorReleaseNumber(rawRelease: string): string {
        const matches = rawRelease.match(/^\d+(\.\d+)?/);
        if (matches) {
            return matches[0];
        }

        return '';
    }

    /**
     * Get current site or undefined if none.
     *
     * @returns Current site or undefined if none.
     */
    getCurrentSite(): CoreSite | undefined {
        return this.currentSite;
    }

    /**
     * Get current site or fail if none.
     *
     * @returns Current site.
     */
    getRequiredCurrentSite(): CoreSite {
        if (!this.currentSite) {
            throw new CoreError('You aren\'t authenticated in any site.');
        }

        return this.currentSite;
    }

    /**
     * Get the site home ID of the current site.
     *
     * @returns Current site home ID.
     */
    getCurrentSiteHomeId(): number {
        if (this.currentSite) {
            return this.currentSite.getSiteHomeId();
        } else {
            return 1;
        }
    }

    /**
     * Get current site ID.
     *
     * @returns Current site ID.
     */
    getCurrentSiteId(): string {
        if (this.currentSite) {
            return this.currentSite.getId();
        } else {
            return '';
        }
    }

    /**
     * Get current site User ID.
     *
     * @returns Current site User ID.
     */
    getCurrentSiteUserId(): number {
        return this.currentSite?.getUserId() || 0;
    }

    /**
     * Check if the user is logged in a site.
     *
     * @returns Whether the user is logged in a site.
     */
    isLoggedIn(): boolean {
        return this.currentSite !== undefined && this.currentSite.token !== undefined &&
            this.currentSite.token != '';
    }

    /**
     * Returns if the site is the current one.
     *
     * @param site Site object or siteId to be compared. If not defined, use current site.
     * @returns Whether site or siteId is the current one.
     */
    isCurrentSite(site?: string | CoreSite): boolean {
        if (!site || !this.currentSite) {
            return !!this.currentSite;
        }

        const siteId = typeof site == 'object' ? site.getId() : site;

        return this.currentSite.getId() === siteId;
    }

    /**
     * Unset current site.
     */
    unsetCurrentSite(): void {
        this.currentSite = undefined;
    }

    /**
     * Check if a WS is available in the current site, if any.
     *
     * @param method WS name.
     * @returns Whether the WS is available.
     */
    wsAvailableInCurrentSite(method: string): boolean {
        const site = this.getCurrentSite();

        return site ? site.wsAvailable(method) : false;
    }

    /**
     * Returns the Site Schema names that can be cleared on space storage.
     *
     * @param site The site that will be cleared.
     * @returns Name of the site schemas.
     */
    getSiteTableSchemasToClear(site: CoreSite): string[] {
        let reset: string[] = [];
        const schemas = Object.values(this.siteSchemas).concat(Object.values(this.pluginsSiteSchemas));

        schemas.forEach((schema) => {
            if (schema.canBeCleared && (!schema.siteId || site.getId() == schema.siteId)) {
                reset = reset.concat(schema.canBeCleared);
            }
        });

        return reset;
    }

    /**
     * Returns presets for a given reading strategy.
     *
     * @param strategy Reading strategy.
     * @returns PreSets options object.
     */
    getReadingStrategyPreSets(strategy?: CoreSitesReadingStrategy): CoreSiteWSPreSets {
        switch (strategy) {
            case CoreSitesReadingStrategy.PREFER_CACHE:
                return {
                    omitExpires: true,
                };
            case CoreSitesReadingStrategy.ONLY_CACHE:
                return {
                    omitExpires: true,
                    forceOffline: true,
                };
            case CoreSitesReadingStrategy.PREFER_NETWORK:
                return {
                    getFromCache: false,
                };
            case CoreSitesReadingStrategy.ONLY_NETWORK:
                return {
                    getFromCache: false,
                    emergencyCache: false,
                };
            case CoreSitesReadingStrategy.STALE_WHILE_REVALIDATE:
                return {
                    updateInBackground: true,
                    getFromCache: true,
                    saveToCache: true,
                };
            default:
                return {};
        }
    }

    /**
     * Check whether a site is using a default image or not.
     *
     * @param site Site info.
     * @returns Whether the site is using a default image.
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    hasDefaultImage(site: CoreLoginSiteInfo): boolean {
        return false;
    }

}

export const CoreSites = asyncInstance<CoreSitesProvider, EagerCoreSitesProvider>(async () => {
    const { CoreSites } = await import('./sites-lazy');

    return CoreSites;
}, new EagerCoreSitesProvider());

/**
 * Response of checking if a site exists and its configuration.
 */
export type CoreSiteCheckResponse = {
    /**
     * Code to identify the authentication method to use.
     */
    code: number;

    /**
     * Site url to use (might have changed during the process).
     */
    siteUrl: string;

    /**
     * Service used.
     */
    service: string;

    /**
     * Site public config (if available).
     */
    config?: CoreSitePublicConfigResponse;
};

/**
 * Response of getting user token.
 */
export type CoreSiteUserTokenResponse = {
    /**
     * User token.
     */
    token: string;

    /**
     * Site URL to use.
     */
    siteUrl: string;

    /**
     * User private token.
     */
    privateToken?: string;
};

/**
 * Site's basic info.
 */
export type CoreSiteBasicInfo = {
    id: string; // Site ID.
    userId?: number; // User ID.
    siteUrl: string; // Site URL.
    siteUrlWithoutProtocol: string; // Site URL without protocol.
    fullname?: string; // User's full name.
    firstname?: string; // User's first name.
    lastname?: string; // User's last name.
    userpictureurl?: string; // User avatar.
    siteName?: string; // Site's name.
    badge?: number; // Badge to display in the site.
    siteHomeId?: number; // Site home ID.
    loggedOut: boolean; // If Site is logged out.
    info?: CoreSiteInfo; // Site info.
};

/**
 * Site schema and migration function.
 */
export type CoreSiteSchema = {
    /**
     * Name of the schema.
     */
    name: string;

    /**
     * Latest version of the schema (integer greater than 0).
     */
    version: number;

    /**
     * Names of the tables of the site schema that can be cleared.
     */
    canBeCleared?: string[];

    /**
     * Tables to create when installing or upgrading the schema.
     */
    tables?: SQLiteDBTableSchema[];

    /**
     * Migrates the schema in a site to the latest version.
     *
     * Called when upgrading the schema, after creating the defined tables.
     *
     * @param db Site database.
     * @param oldVersion Old version of the schema or 0 if not installed.
     * @param siteId Site Id to migrate.
     * @returns Promise resolved when done.
     */
    migrate?(db: SQLiteDB, oldVersion: number, siteId: string): Promise<void> | void;

    /**
     * Make changes to install the schema in a site.
     *
     * Called when installing the schema, after creating the defined tables.
     *
     * @param db Site database.
     * @param siteId Site Id to migrate.
     * @returns Promise resolved when done.
     */
    install?(db: SQLiteDB, siteId: string): Promise<void> | void;
};

/**
 * Data about sites to be listed.
 */
export type CoreLoginSiteInfo = {
    /**
     * Site name.
     */
    name: string;

    /**
     * Site alias.
     */
    alias?: string;

    /**
     * URL of the site.
     */
    url: string;

    /**
     * Image URL of the site.
     */
    imageurl?: string;

    /**
     * City of the site.
     */
    city?: string;

    /**
     * Countrycode of the site.
     */
    countrycode?: string;

    /**
     * Is staging site.
     */
    staging?: boolean;

    /**
     * Class to apply to site item.
     */
    className?: string;

    /**
     * Whether the site is for demo mode usage.
     */
    demoMode?: boolean;
};

/**
 * Registered site schema.
 */
export type CoreRegisteredSiteSchema = CoreSiteSchema & {
    /**
     * Site ID to apply the schema to. If not defined, all sites.
     */
    siteId?: string;
};

/**
 * Possible reading strategies (for cache).
 */
export const enum CoreSitesReadingStrategy {
    ONLY_CACHE,
    PREFER_CACHE,
    ONLY_NETWORK,
    PREFER_NETWORK,
    STALE_WHILE_REVALIDATE,
}

/**
 * Common options used when calling a WS through CoreSite.
 */
export type CoreSitesCommonWSOptions = {
    readingStrategy?: CoreSitesReadingStrategy; // Reading strategy.
    siteId?: string; // Site ID. If not defined, current site.
};

/**
 * Data about a certain demo site.
 */
export type CoreSitesDemoSiteData = {
    url: string;
    username: string;
    password: string;
};

/**
 * Response of calls to login/token.php.
 */
export type CoreSitesLoginTokenResponse = {
    token?: string;
    privatetoken?: string;
    error?: string;
    errorcode?: string;
    stacktrace?: string;
    debuginfo?: string;
    reproductionlink?: string;
};

/**
 * Options for logout.
 */
export type CoreSitesLogoutOptions = {
    forceLogout?: boolean; // If true, site will be marked as logged out, no matter the value tool_mobile_forcelogout.
    removeAccount?: boolean; // If true, site will be removed too after logout.
};
