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

import { FileEntry } from '@awesome-cordova-plugins/file/ngx';
import { CoreConstants } from '@/core/constants';
import { asyncInstance } from '@/core/utils/async-instance';
import { CoreError } from '@classes/errors/error';
import { CoreWSError } from '@classes/errors/wserror';
import { CoreInterceptor } from '@classes/interceptor';
import { Translate } from '@singletons';
import { CoreErrorLogs } from '@singletons/error-logs';
import { CoreLogger } from '@singletons/logger';
import { CoreNetwork } from '@services/network';
import { CoreNetworkError } from '@classes/errors/network-error';

export class CoreWSEagerProvider {

    logger: CoreLogger;

    constructor() {
        this.logger = CoreLogger.getInstance('CoreWSProvider');
    }

    /**
     * Converts an objects values to strings where appropriate.
     * Arrays (associative or otherwise) will be maintained, null values will be removed.
     *
     * @param data The data that needs all the non-object values set to strings.
     * @param stripUnicode If Unicode long chars need to be stripped.
     * @returns The cleaned object or null if some strings becomes empty after stripping Unicode.
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    convertValuesToString(data: any, stripUnicode?: boolean): any {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const result: any = Array.isArray(data) ? [] : {};

        for (const key in data) {
            let value = data[key];

            if (value == null) {
                // Skip null or undefined value.
                continue;
            } else if (typeof value == 'object') {
                // Object or array.
                value = this.convertValuesToString(value, stripUnicode);
                if (value == null) {
                    return null;
                }
            } else if (typeof value === 'string') {
                if (stripUnicode) {
                    const stripped = this.stripUnicode(value);
                    if (stripped != value && stripped.trim().length == 0) {
                        return null;
                    }
                    value = stripped;
                }
            } else if (typeof value == 'boolean') {
                /* Moodle does not allow "true" or "false" in WS parameters, only in POST parameters.
                    We've been using "true" and "false" for WS settings "filter" and "fileurl",
                    we keep it this way to avoid changing cache keys. */
                if (key == 'moodlewssettingfilter' || key == 'moodlewssettingfileurl') {
                    value = value ? 'true' : 'false';
                } else {
                    value = value ? '1' : '0';
                }
            } else if (typeof value == 'number') {
                value = String(value);
            } else {
                // Unknown type.
                continue;
            }

            if (Array.isArray(result)) {
                result.push(value);
            } else {
                result[key] = value;
            }
        }

        return result;
    }

    /**
     * It will check if response has failed and throw the propper error.
     *
     * @param response WS response.
     * @param defaultMessage Message to be used in case warnings is empty.
     */
    throwOnFailedStatus(response: CoreStatusWithWarningsWSResponse, defaultMessage: string): void {
        if (!response.status) {
            if (response.warnings && response.warnings.length) {
                throw new CoreWSError(response.warnings[0]);
            }

            throw new CoreError(defaultMessage);
        }
    }

    /**
     * Get a request timeout based on the network connection.
     *
     * @returns Timeout in ms.
     */
    getRequestTimeout(): number {
        return CoreNetwork.isNetworkAccessLimited() ? CoreConstants.WS_TIMEOUT : CoreConstants.WS_TIMEOUT_WIFI;
    }

        /**
         * A wrapper function for a synchronous Moodle WebService call.
         * Warning: This function should only be used if synchronous is a must. It's recommended to use call.
         *
         * @param method The WebService method to be called.
         * @param data Arguments to pass to the method.
         * @param preSets Extra settings and information.
         * @returns Promise resolved with the response data in success and rejected with the error message if it fails.
         */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    syncCall<T = unknown>(method: string, data: any, preSets: CoreWSPreSets): T {
        try {
            if (!preSets) {
                throw new CoreError(Translate.instant('core.unexpectederror'));
            } else if (!CoreNetwork.isOnline()) {
                throw new CoreNetworkError();
            }

            preSets.typeExpected = preSets.typeExpected || 'object';
            if (preSets.responseExpected === undefined) {
                preSets.responseExpected = true;
            }

            data = this.convertValuesToString(data || {}, preSets.cleanUnicode);
            if (data == null) {
                // Empty cleaned text found.
                throw new CoreError(Translate.instant('core.unicodenotsupportedcleanerror'));
            }

            data.wsfunction = method;
            data.wstoken = preSets.wsToken;
            const siteUrl = preSets.siteUrl + '/webservice/rest/server.php?moodlewsrestformat=json';

            // Serialize data.
            data = CoreInterceptor.serialize(data);

            // Perform sync request using XMLHttpRequest.
            const xhr = new XMLHttpRequest();
            xhr.open('post', siteUrl, false);
            xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded;charset=utf-8');

            xhr.send(data);

            // Get response.
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            data = ('response' in xhr) ? xhr.response : (<any> xhr).responseText;

            // Check status.
            const status = Math.max(xhr.status === 1223 ? 204 : xhr.status, 0);
            if (status < 200 || status >= 300) {
                // Request failed.
                throw new CoreError(data);
            }

            // Treat response.
            data = this.parseJSON(data);

            // Some moodle web services return null.
            // If the responseExpected value is set then so long as no data is returned, we create a blank object.
            if ((!data || !data.data) && !preSets.responseExpected) {
                data = {};
            }

            if (!data) {
                throw new CoreError(Translate.instant('core.serverconnection', {
                    details: Translate.instant('core.errorinvalidresponse', { method }),
                }));
            } else if (typeof data != preSets.typeExpected) {
                this.logger.warn('Response of type "' + typeof data + '" received, expecting "' + preSets.typeExpected + '"');
                throw new CoreError(Translate.instant('core.errorinvalidresponse', { method }));
            }

            if (data.exception !== undefined || data.debuginfo !== undefined) {
                throw new CoreWSError(data);
            }

            return data;
        } catch (err) {
            let errorType = '';

            if (err instanceof CoreError) {
                errorType = 'CoreError';
            } else if (err instanceof CoreWSError) {
                errorType = 'CoreWSError';
            }

            CoreErrorLogs.addErrorLog({ method, type: errorType, message: String(err), time: new Date().getTime(), data });
            throw err;
        }
    }

    // TODO copied from text
    private stripUnicode(text: string): string {
        let stripped = '';
        for (let x = 0; x < text.length; x++) {
            if (text.charCodeAt(x) <= 55295) {
                stripped += text.charAt(x);
            }
        }

        return stripped;
    }

    // TODO copied from text
    private parseJSON<T>(json: string, defaultValue?: T, logErrorFn?: (error?: Error) => void): T {
        try {
            return JSON.parse(json);
        } catch (error) {
            // Error, log the error if needed.
            if (logErrorFn) {
                logErrorFn(error);
            }
        }

        // Error parsing, return the default value or the original value.
        if (defaultValue !== undefined) {
            return defaultValue;
        }

        throw new CoreError('JSON cannot be parsed and not default value has been provided');
    }

}

export const CoreWS = asyncInstance(async () => {
    const { CoreWS } = await import('./ws-lazy');

    return CoreWS;
}, new CoreWSEagerProvider());

/**
 * File upload options.
 */
export interface CoreWSFileUploadOptions extends FileUploadOptions {
    /**
     * The file area where to put the file. By default, 'draft'.
     */
    fileArea?: string;

    /**
     * Item ID of the area where to put the file. By default, 0.
     */
    itemId?: number;
}

/**
 * Structure of warnings returned by WS.
 */
export type CoreWSExternalWarning = {
    /**
     * Item.
     */
    item?: string;

    /**
     * Item id.
     */
    itemid?: number;

    /**
     * The warning code can be used by the client app to implement specific behaviour.
     */
    warningcode: string;

    /**
     * Untranslated english message to explain the warning.
     */
    message: string;

};

/**
 * Special response structure of many webservices that contains success status and warnings.
 */
export type CoreStatusWithWarningsWSResponse = {
    status: boolean; // Status: true if success.
    offline?: boolean; // True if information has been stored in offline for future use.
    warnings?: CoreWSExternalWarning[];
};

/**
 * Special response structure of many webservices that contains only warnings.
 */
export type CoreWarningsWSResponse = {
    warnings?: CoreWSExternalWarning[];
};

/**
 * Structure of files returned by WS.
 */
export type CoreWSExternalFile = {
    fileurl: string; // Downloadable file url.
    filename?: string; // File name.
    filepath?: string; // File path.
    filesize?: number; // File size.
    timemodified?: number; // Time modified.
    mimetype?: string; // File mime type.
    isexternalfile?: number; // Whether is an external file.
    repositorytype?: string; // The repository type for external files.
};

/**
 * Structure of files returned by stored_file_exporter.
 */
export type CoreWSStoredFile = {
    contextid: number; // Contextid.
    component: string; // Component.
    filearea: string; // Filearea.
    itemid: number; // Itemid.
    filepath: string; // Filepath.
    filename: string; // Filename.
    isdir: boolean; // Isdir.
    isimage: boolean; // Isimage.
    timemodified: number; // Timemodified.
    timecreated: number; // Timecreated.
    filesize: number; // Filesize.
    author: string; // Author.
    license: string; // License.
    filenameshort: string; // Filenameshort.
    filesizeformatted: string; // Filesizeformatted.
    icon: string; // Icon.
    timecreatedformatted: string; // Timecreatedformatted.
    timemodifiedformatted: string; // Timemodifiedformatted.
    url: string; // Url.
    urls: {
        export?: string; // The URL used to export the attachment.
    };
    html: {
        plagiarism?: string; // The HTML source for the Plagiarism Response.
    };
    mimetype: undefined; // File mimetype. @todo Not implemented yet in Moodle, see MDL-71354.
};

/**
 * Common file structures returned by WS.
 */
export type CoreWSFile = CoreWSExternalFile | CoreWSStoredFile;

/**
 * Data returned by date_exporter.
 */
export type CoreWSDate = {
    seconds: number; // Seconds.
    minutes: number; // Minutes.
    hours: number; // Hours.
    mday: number; // Mday.
    wday: number; // Wday.
    mon: number; // Mon.
    year: number; // Year.
    yday: number; // Yday.
    weekday: string; // Weekday.
    month: string; // Month.
    timestamp: number; // Timestamp.
};

/**
 * PreSets accepted by the WS call.
 */
export type CoreWSPreSets = {
    /**
     * The site URL.
     */
    siteUrl: string;

    /**
     * The Webservice token.
     */
    wsToken: string;

    /**
     * Defaults to true. Set to false when the expected response is null.
     */
    responseExpected?: boolean;

    /**
     * Defaults to 'object'. Use it when you expect a type that's not an object|array.
     */
    typeExpected?: CoreWSTypeExpected;

    /**
     * Defaults to false. Clean multibyte Unicode chars from data.
     */
    cleanUnicode?: boolean;

    /**
     * Whether to split a request if it has too many parameters. Sending too many parameters to the site
     * can cause the request to fail (see PHP's max_input_vars).
     */
    splitRequest?: CoreWSPreSetsSplitRequest;
};

export type CoreWSTypeExpected = 'boolean'|'number'|'string'|'jsonstring'|'object';

/**
 * Options to split a request.
 */
export type CoreWSPreSetsSplitRequest = {
    /**
     * Name of the parameter used to split the request if too big. Must be an array parameter.
     */
    param: string;

    /**
     * Max number of entries sent per request.
     */
    maxLength: number;

    /**
     * Callback to combine the results. If not supplied, arrays in the result will be concatenated.
     */
    combineCallback?: (previousValue: unknown, currentValue: unknown, currentIndex: number, array: unknown[]) => unknown;
};

/**
 * PreSets accepted by AJAX WS calls.
 */
export type CoreWSAjaxPreSets = {
    /**
     * The site URL.
     */
    siteUrl: string;

    /**
     * Defaults to true. Set to false when the expected response is null.
     */
    responseExpected?: boolean;

    /**
     * Whether to use the no-login endpoint instead of the normal one. Use it for requests that don't require authentication.
     */
    noLogin?: boolean;

    /**
     * Whether to send the parameters via GET. Only if noLogin is true.
     */
    useGet?: boolean;
};

/**
 * Options for HTTP requests.
 */
export type HttpRequestOptions = {
    /**
     * The HTTP method.
     */
    method: 'get' | 'post' | 'put' | 'patch' | 'head' | 'delete' | 'options' | 'upload' | 'download';

    /**
     * Payload to send to the server. Only applicable on post, put or patch methods.
     */
    data?: Record<string, unknown>;

    /**
     * Query params to be appended to the URL (only applicable on get, head, delete, upload or download methods).
     */
    params?: Record<string, string | number>;

    /**
     * Response type. Defaults to json.
     */
    responseType?: 'json' | 'text' | 'arraybuffer' | 'blob';

    /**
     * Timeout for the request in seconds. If undefined, the default value will be used. If null, no timeout.
     */
    timeout?: number;

    /**
     * Serializer to use. Defaults to 'urlencoded'. Only for mobile environments.
     */
    serializer?: 'json' | 'urlencoded' | 'utf8' | 'multipart';

    /**
     * Whether to follow redirects. Defaults to true. Only for mobile environments.
     */
    followRedirect?: boolean;

    /**
     * Headers. Only for mobile environments.
     */
    headers?: Record<string, string>;

    /**
     * File paths to use for upload or download. Only for mobile environments.
     */
    filePath?: string | string[];

    /**
     * Name to use during upload. Only for mobile environments.
     */
    name?: string | string[];
};

/**
 * Downloaded file entry. It includes some calculated data.
 */
export type CoreWSDownloadedFileEntry = FileEntry & {
    extension: string; // File extension.
    path: string; // File path.
};

export type CoreWSUploadFileResult = {
    component: string; // Component the file was uploaded to.
    context: string; // Context the file was uploaded to.
    userid: number; // User that uploaded the file.
    filearea: string; // File area the file was uploaded to.
    filename: string; // File name.
    filepath: string; // File path.
    itemid: number; // Item ID the file was uploaded to.
    license: string; // File license.
    author: string; // Author name.
    source: string; // File source.
};
