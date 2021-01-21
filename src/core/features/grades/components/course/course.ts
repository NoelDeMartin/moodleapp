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

import { Component, Input, OnInit } from '@angular/core';
import { CoreGrades } from '@features/grades/services/grades';
import { CoreGradesHelper } from '@features/grades/services/grades-helper';
import { CoreNavigator } from '@services/navigator';
import { CoreDomUtils } from '@services/utils/dom';
import { CoreUtils } from '@services/utils/utils';

/**
 * Component that displays a course grades.
 */
@Component({
    selector: 'core-grades-course',
    templateUrl: 'core-grades-course.html',
    styleUrls: ['course.scss'],
})
export class CoreGradesCourseComponent implements OnInit {

    @Input() courseId!: number;
    @Input() userId!: number;
    @Input() gradeId?: number;

    gradesLoaded = false;
    gradesTable: any;

    /**
     * @inheritdoc
     */
    async ngOnInit(): Promise<void> {
        try {
            await this.fetchData();

            if (this.gradeId) {
                // There is the grade to load.
                this.gotoGrade(this.gradeId);
            }

            // Add log in Moodle.
            return CoreUtils.instance.ignoreErrors(CoreGrades.instance.logCourseGradesView(this.courseId, this.userId));
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
            const table = await CoreGrades.instance.getCourseGradesTable(this.courseId, this.userId);

            this.gradesTable = CoreGradesHelper.instance.formatGradesTable(table);
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
        CoreGrades.instance.invalidateCourseGradesData(this.courseId, this.userId).finally(() => {
            this.fetchData().finally(() => {
                refresher.complete();
            });
        });
    }

    /**
     * Navigate to the grade of the selected item.
     *
     * @param gradeId Grade item ID where to navigate.
     */
    gotoGrade(gradeId: number): void {
        CoreNavigator.instance.navigate(gradeId.toString());

        // @todo
        // if (gradeId) {
        //     this.gradeId = gradeId;
        //     let whereToPush; let pageName;

        //     if (this.svComponent) {
        //         if (this.svComponent.getMasterNav().getActive().component.name == 'CoreGradesCourseSplitPage') {
        //             // Table is on left side. Push on right.
        //             whereToPush = this.svComponent;
        //             pageName = 'CoreGradesGradePage';
        //         } else {
        //             // Table is on right side. Load new split view.
        //             whereToPush = this.svComponent.getMasterNav();
        //             pageName = 'CoreGradesCourseSplitPage';
        //         }
        //     } else {
        //         if (this.appProvider.isWide()) {
        //             // Table is full screen and large. Load here.
        //             whereToPush = this.navCtrl;
        //             pageName = 'CoreGradesCourseSplitPage';
        //         } else {
        //             // Table is full screen but on mobile. Load here.
        //             whereToPush = this.navCtrl;
        //             pageName = 'CoreGradesGradePage';
        //         }

        //     }
        //     whereToPush.push(pageName, { courseId: this.courseId, userId: this.userId, gradeId: gradeId });
        // }
    }

}
