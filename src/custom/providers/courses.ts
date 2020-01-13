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

import { Injectable } from '@angular/core';
import { CoreSite } from '@classes/site';
import { CoreCoursesProvider } from '@core/courses/providers/courses';

/**
 * Service that provides some features regarding lists of courses and categories.
 */
@Injectable()
export class CustomCoreCoursesProvider extends CoreCoursesProvider {

    downloadsEnabled = false;

    /**
     * Check if download a whole course is disabled in a certain site.
     *
     * @param site Site. If not defined, use current site.
     * @return Whether it's disabled.
     */
    isDownloadCourseDisabledInSite(site?: CoreSite): boolean {
        if (! this.downloadsEnabled) {
            return true;
        }

        return super.isDownloadCourseDisabledInSite(site);
    }

}
