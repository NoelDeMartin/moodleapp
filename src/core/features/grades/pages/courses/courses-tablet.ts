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
import { CoreGrades } from '@features/grades/services/grades';
import { CoreGradesHelper } from '@features/grades/services/grades-helper';
import { CoreNavigator } from '@services/navigator';
import { CoreDomUtils } from '@services/utils/dom';
import { CoreUtils } from '@services/utils/utils';

/**
 * Page that displays courses grades (main menu option).
 */
@Component({
    selector: 'page-core-grades-courses-tablet',
    templateUrl: 'courses-tablet.html',
})
export class CoreGradesCoursesTabletPage implements OnInit {

    grades: any[] = [];
    courseId?: number;
    userId?: number;
    gradesLoaded = false;

    /**
     * @inheritdoc
     */
    async ngOnInit(): Promise<void> {
        // @todo this was ionViewDidLoad before, how can courseId be set?
        if (this.courseId) {
            // There is the course to load, open the course in a new state.
            this.gotoCourseGrades(this.courseId);
        }

        try {
            await this.fetchData();

            // if (!this.courseId && this.grades.length > 0) {
            //     this.gotoCourseGrades(this.grades[0].courseid);
            // }

            // Add log in Moodle.
            await CoreUtils.instance.ignoreErrors(CoreGrades.instance.logCoursesGradesView());
        } finally {
            this.gradesLoaded = true;
        }
    }

    /**
     * Fetch all the data required for the view.
     *
     * @return Resolved when done.
     */
    async fetchData(): Promise<void> {
        try {
            const grades = await CoreGrades.instance.getCoursesGrades();
            const courseData = await CoreGradesHelper.instance.getGradesCourseData(grades);

            this.grades = courseData;
        } catch (error) {
            CoreDomUtils.instance.showErrorModalDefault(error, 'Error loading grades');
        }
    }

    /**
     * Refresh data.
     *
     * @param refresher Refresher.
     */
    refreshGrades(refresher: any): void {
        CoreGrades.instance.invalidateCoursesGradesData().finally(() => {
            this.fetchData().finally(() => {
                refresher?.detail.complete();
            });
        });
    }

    /**
     * Navigate to the grades of the selected course.
     *
     * @param courseId Course Id where to navigate.
     */
    async gotoCourseGrades(courseId: number): Promise<void> {
        const path = this.courseId ? `../${courseId}` : courseId.toString();
        this.courseId = courseId;

        await CoreNavigator.instance.navigate(path);
    }

}
