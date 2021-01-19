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
import { RouterModule, Routes } from '@angular/router';

import { CoreSharedModule } from '@/core/shared.module';
import { CoreScreen } from '@services/screen';

import { CoreSettingsIndexMobilePage } from './pages/index/index-mobile';
import { CoreSettingsIndexTabletPage } from './pages/index/index-tablet';

const sectionRoutes: Routes = [
    {
        path: 'general',
        loadChildren: () => import('./pages/general/general.module').then(m => m.CoreSettingsGeneralPageModule),
    },
    {
        path: 'spaceusage',
        loadChildren: () => import('./pages/space-usage/space-usage.module').then(m => m.CoreSettingsSpaceUsagePageModule),
    },
    {
        path: 'sync',
        loadChildren: () =>
            import('./pages/synchronization/synchronization.module')
                .then(m => m.CoreSettingsSynchronizationPageModule),
    },
    // @todo sharedfiles
    {
        path: 'about',
        loadChildren: () => import('./pages/about/about.module').then(m => m.CoreSettingsAboutPageModule),
    },
];

const routes: Routes = [
    {
        matcher: () => !CoreScreen.instance.isMobile ? { consumed: [] } : null,
        component: CoreSettingsIndexTabletPage,
        children: [
            {
                path: '',
                pathMatch: 'full',
                redirectTo: 'general',
            },
            ...sectionRoutes,
        ],
    },
    {
        matcher: () => CoreScreen.instance.isMobile ? { consumed: [] } : null,
        component: CoreSettingsIndexMobilePage,
    },
    ...sectionRoutes,
];

@NgModule({
    imports: [
        RouterModule.forChild(routes),
        CoreSharedModule,
    ],
    declarations: [
        CoreSettingsIndexMobilePage,
        CoreSettingsIndexTabletPage,
    ],
})
export class CoreSettingsLazyModule {}
