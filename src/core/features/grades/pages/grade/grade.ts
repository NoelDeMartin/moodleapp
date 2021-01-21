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

import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CoreGrades } from '@features/grades/services/grades';
import { CoreGradesHelper } from '@features/grades/services/grades-helper';
import { CoreSites } from '@services/sites';
import { CoreDomUtils } from '@services/utils/dom';

/**
 * Page that displays activity grade.
 */
@Component({
    selector: 'page-core-grades-grade',
    templateUrl: 'grade.html',
})
export class CoreGradesGradePage implements OnInit {

    grade: any;
    courseId: number;
    userId: number;
    gradeId: number;
    gradeLoaded = false;

    constructor(route: ActivatedRoute) {
        this.courseId = route.snapshot.parent?.params.courseId;
        this.gradeId = route.snapshot.params.gradeId;
        this.userId = route.snapshot.queryParams.userId ?? CoreSites.instance.getCurrentSiteUserId();
    }

    /**
     * View loaded.
     */
    ngOnInit(): void {
        this.fetchData().finally(() => {
            this.gradeLoaded = true;
        });
    }

    /**
     * Fetch all the data required for the view.
     *
     * @return Resolved when done.
     */
    async fetchData(): Promise<void> {
        try {
            this.grade = await CoreGradesHelper.instance.getGradeItem(this.courseId, this.gradeId, this.userId);
        } catch (error) {
            CoreDomUtils.instance.showErrorModalDefault(error, 'Error loading grade item');
        }
    }

    /**
     * Refresh data.
     *
     * @param refresher Refresher.
     */
    refreshGrade(refresher: any): void {
        CoreGrades.instance.invalidateCourseGradesData(this.courseId, this.userId).finally(() => {
            this.fetchData().finally(() => {
                refresher?.detail.complete();
            });
        });
    }

}
