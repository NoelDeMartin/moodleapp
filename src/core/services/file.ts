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
import { FileEntry, Entry } from '@awesome-cordova-plugins/file/ngx';
import { CoreFileEntry } from '@services/file-helper';
import { CorePlatform } from '@services/platform';
import { WebView } from '@singletons';

/**
 * Progress event used when writing a file data into a file.
 */
export type CoreFileProgressEvent = {
    /**
     * Whether the values are reliabñe.
     */
    lengthComputable?: boolean;

    /**
     * Number of treated bytes.
     */
    loaded?: number;

    /**
     * Total of bytes.
     */
    total?: number;
};

/**
 * Progress function.
 */
export type CoreFileProgressFunction = (event: CoreFileProgressEvent) => void;

/**
 * Constants to define the format to read a file.
 */
export const enum CoreFileFormat {
    FORMATTEXT = 0,
    FORMATDATAURL = 1,
    FORMATBINARYSTRING = 2,
    FORMATARRAYBUFFER = 3,
    FORMATJSON = 4,
}

export class CoreFileProvider {

    // Folders.
    static readonly SITESFOLDER = 'sites';
    static readonly TMPFOLDER = 'tmp';
    static readonly NO_SITE_FOLDER = 'nosite';

    static readonly CHUNK_SIZE = 1048576; // 1 MB. Same chunk size as Ionic Native.

    basePath = '';
    isHTMLAPI = false;

    /**
     * Sets basePath to use with HTML API. Reserved for core use.
     *
     * @param path Base path to use.
     */
    setHTMLBasePath(path: string): void {
        this.isHTMLAPI = true;
        this.basePath = path;
    }

    /**
     * Checks if we're using HTML API.
     *
     * @returns True if uses HTML API, false otherwise.
     */
    usesHTMLAPI(): boolean {
        return this.isHTMLAPI;
    }

    /**
     * Check if the plugin is available.
     *
     * @returns Whether the plugin is available.
     */
    isAvailable(): boolean {
        return window.resolveLocalFileSystemURL !== undefined;
    }

    /**
     * Get site folder path.
     *
     * @param siteId Site ID.
     * @returns Site folder path.
     */
    getSiteFolder(siteId: string): string {
        return CoreFileProvider.SITESFOLDER + '/' + siteId;
    }

    /**
     * Normalize a filename that usually comes URL encoded.
     *
     * @param filename The file name.
     * @returns The file name normalized.
     */
    normalizeFileName(filename: string): string {
        filename = this.decodeURIComponent(filename);

        return filename;
    }

    /**
     * Get the base path where the application files are stored. Returns the value instantly, without waiting for it to be ready.
     *
     * @returns Base path. If the service hasn't been initialized it will return an invalid value.
     */
    getBasePathInstant(): string {
        if (!this.basePath) {
            return this.basePath;
        } else if (this.basePath.slice(-1) == '/') {
            return this.basePath;
        } else {
            return this.basePath + '/';
        }
    }

    /**
     * Extract the file name and directory from a given path.
     *
     * @param path Path to be extracted.
     * @returns Plain object containing the file name and directory.
     * @description
     * file.pdf         -> directory: '', name: 'file.pdf'
     * /file.pdf        -> directory: '', name: 'file.pdf'
     * path/file.pdf    -> directory: 'path', name: 'file.pdf'
     * path/            -> directory: 'path', name: ''
     * path             -> directory: '', name: 'path'
     */
    getFileAndDirectoryFromPath(path: string): {directory: string; name: string} {
        const file = {
            directory: '',
            name: '',
        };

        file.directory = path.substring(0, path.lastIndexOf('/'));
        file.name = path.substring(path.lastIndexOf('/') + 1);

        return file;
    }

    /**
     * Get the internal URL of a file.
     * Please notice that with WKWebView these URLs no longer work in mobile. Use fileEntry.toURL() along with convertFileSrc.
     *
     * @param fileEntry File Entry.
     * @returns Internal URL.
     */
    getInternalURL(fileEntry: FileEntry): string {
        if (!fileEntry.toInternalURL) {
            // File doesn't implement toInternalURL, use toURL.
            return this.getFileEntryURL(fileEntry);
        }

        return fileEntry.toInternalURL();
    }

    /**
     * Get the URL (absolute path) of a file.
     * Use this function instead of doing fileEntry.toURL because the latter causes problems with WebView and other plugins.
     *
     * @param fileEntry File Entry.
     * @returns URL.
     */
    getFileEntryURL(fileEntry: Entry): string {
        if (CorePlatform.isAndroid()) {
            // Cordova plugin file v7 changed the format returned by toURL, the new format it's not compatible with
            // Ionic WebView or FileTransfer plugin.
            return fileEntry.nativeURL;
        }

        return fileEntry.toURL();
    }

    /**
     * Adds the basePath to a path if it doesn't have it already.
     *
     * @param path Path to treat.
     * @returns Path with basePath added.
     */
    addBasePathIfNeeded(path: string): string {
        if (path.indexOf(this.basePath) > -1) {
            return path;
        } else {
            return this.concatenatePaths(this.basePath, path);
        }
    }

    /**
     * Remove the base path from a path.
     *
     * @param path Path to treat.
     * @returns Path without basePath.
     */
    removeBasePath(path: string): string {
        return this.removeStartingSlash(path.replace(this.basePath, ''));
    }

    /**
     * Given a file name and a set of already used names, calculate a unique name.
     *
     * @param usedNames Object with names already used as keys.
     * @param name Name to check.
     * @returns Unique name.
     */
    calculateUniqueName(usedNames: Record<string, unknown>, name: string): string {
        if (usedNames[name.toLowerCase()] === undefined) {
            // No file with the same name.
            return name;
        }

        // Repeated name. Add a number until we find a free name.
        // TODO
        // const nameWithoutExtension = CoreMimetypeUtils.removeExtension(name);
        // let extension = CoreMimetypeUtils.getFileExtension(name);
        const nameWithoutExtension = '';
        let extension = '';
        let num = 1;
        extension = extension ? '.' + extension : '';

        do {
            name = nameWithoutExtension + '(' + num + ')' + extension;
            num++;
        } while (usedNames[name.toLowerCase()] !== undefined);

        return name;
    }

    /**
     * Check if a file is inside the app's folder.
     *
     * @param path The absolute path of the file to check.
     * @returns Whether the file is in the app's folder.
     */
    isFileInAppFolder(path: string): boolean {
        return path.indexOf(this.basePath) != -1;
    }

    /**
     * Get the path to the www folder at runtime based on the WebView URL.
     *
     * @returns Path.
     */
    getWWWPath(): string {
        // Use current URL, removing the path.
        if (!window.location.pathname || window.location.pathname == '/') {
            return window.location.href;
        }

        const position = window.location.href.indexOf(window.location.pathname);

        if (position != -1) {
            return window.location.href.substring(0, position);
        }

        return window.location.href;
    }

    /**
     * Get the full path to the www folder.
     *
     * @returns Path.
     */
    getWWWAbsolutePath(): string {
        if (window.cordova && cordova.file && cordova.file.applicationDirectory) {
            return this.concatenatePaths(cordova.file.applicationDirectory, 'www');
        }

        // Cannot use Cordova to get it, use the WebView URL.
        return this.getWWWPath();
    }

    /**
     * Helper function to call Ionic WebView convertFileSrc only in the needed platforms.
     * This is needed to make files work with the Ionic WebView plugin.
     *
     * @param src Source to convert.
     * @returns Converted src.
     */
    convertFileSrc(src: string): string {
        return CorePlatform.isMobile() ? WebView.convertFileSrc(src) : src;
    }

    /**
     * Undo the conversion of convertFileSrc.
     *
     * @param src Source to unconvert.
     * @returns Unconverted src.
     */
    unconvertFileSrc(src: string): string {
        if (!CorePlatform.isMobile()) {
            return src;
        }

        if (CorePlatform.isIOS()) {
            return src.replace(CoreConstants.CONFIG.ioswebviewscheme + '://localhost/_app_file_', 'file://');
        }

        return src.replace('http://localhost/_app_file_', 'file://');
    }

    /**
     * Get the file's name.
     *
     * @param file The file.
     * @returns The file name.
     */
    getFileName(file: CoreFileEntry): string | undefined {
        return this.isFileEntry(file) ? file.name : file.filename;
    }

    // TODO duplicated from CorePath
    private concatenatePaths(leftPath: string, rightPath: string): string {
        if (!leftPath) {
            return rightPath;
        } else if (!rightPath) {
            return leftPath;
        }

        const lastCharLeft = leftPath.slice(-1);
        const firstCharRight = rightPath.charAt(0);

        if (lastCharLeft === '/' && firstCharRight === '/') {
            return leftPath + rightPath.substring(1);
        } else if (lastCharLeft !== '/' && firstCharRight !== '/') {
            return leftPath + '/' + rightPath;
        } else {
            return leftPath + rightPath;
        }
    }

    // TODO duplicated from CoreUtils
    private isFileEntry(file: CoreFileEntry): file is FileEntry {
        return 'isFile' in file;
    }

    // TODO duplicated from CoreUrl
    private decodeURIComponent(uri: string): string {
        try {
            return decodeURIComponent(uri);
        } catch {
            // Error, use the original URI.
        }

        return uri;
    }

    // TODO duplicated from CoreText
    private removeStartingSlash(text = ''): string {
        if (text[0] !== '/') {
            return text;
        }

        return text.substring(1);
    }

}

export const CoreFile = asyncInstance(async () => {
    const { CoreFile } = await import('./file-lazy');

    return CoreFile;
}, new CoreFileProvider());
