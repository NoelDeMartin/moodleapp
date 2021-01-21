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

import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CoreSites } from '@services/sites';

/**
 * Page that displays a course tablet grades.
 */
@Component({
    selector: 'page-core-grades-course-tablet',
    templateUrl: 'course-tablet.html',
})
export class CoreGradesCourseTabletPage {

    courseId: number;
    userId: number;

    constructor(route: ActivatedRoute) {
        this.courseId = route.snapshot.params.courseId;
        this.userId = route.snapshot.queryParams.userId ?? CoreSites.instance.getCurrentSiteUserId();
    }

}
