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

import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';

import { AddonCompetencyCompetencyPage } from './pages/competency/competency.page';
import { AddonCompetencyCompetencySummaryPage } from './pages/competencysummary/competencysummary.page';
import { AddonCompetencyCompetencyPageModule } from './pages/competency/competency.module';
import { AddonCompetencyCompetencySummaryPageModule } from './pages/competencysummary/competencysummary.module';
import { AddonCompetencyCourseCompetenciesPage } from './pages/coursecompetencies/coursecompetencies.page';
import { AddonCompetencyCourseCompetenciesPageModule } from './pages/coursecompetencies/coursecompetencies.module';
import { AddonCompetencyCompetenciesPage } from './pages/competencies/competencies.page';
import { CoreScreen } from '@services/screen';
import { AddonCompetencyCompetenciesPageModule } from './pages/competencies/competencies.module';
import { conditionalRoutes, CoreLazyRoutesModule, defineRoutes } from '@services/router';

const mobileRoutes = defineRoutes([
    {
        path: '',
        component: AddonCompetencyCourseCompetenciesPage,
    },
    {
        path: ':competencyId',
        component: AddonCompetencyCompetencyPage,
    },
]);

const tabletRoutes = defineRoutes([
    {
        path: '',
        component: AddonCompetencyCompetenciesPage,
        children: [
            {
                path: ':competencyId',
                component: AddonCompetencyCompetencyPage,
            },
        ],
    },
]);

const typedRoutes = [
    ...conditionalRoutes(mobileRoutes, () => CoreScreen.isMobile),
    ...defineRoutes([
        {
            path: ':competencyId/summary',
            component: AddonCompetencyCompetencySummaryPage,
        },
    ]),
];

const routes = [
    ...typedRoutes,
    ...conditionalRoutes(tabletRoutes, () => CoreScreen.isTablet),
];

@NgModule({
    imports: [
        RouterModule.forChild(routes),
        AddonCompetencyCourseCompetenciesPageModule,
        AddonCompetencyCompetenciesPageModule,
        AddonCompetencyCompetencyPageModule,
        AddonCompetencyCompetencySummaryPageModule,
    ],
})
export class AddonCompetencyCourseDetailsLazyModule extends CoreLazyRoutesModule<typeof typedRoutes> {}
