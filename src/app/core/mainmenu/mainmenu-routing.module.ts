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

import { CoreMainMenuPage } from './pages/menu/menu.page';
import { CoreMainMenuMorePage } from './pages/more/more.page';

import { routes as settingsRoutes } from '@core/settings/settings-routing.module';

const childRoutes = [
    { path: 'settings', children: settingsRoutes },
    {
        path: 'home',
        children: [
            {
                path: '',
                loadChildren:
                    () => import('../courses/pages/home/home.page.module').then( m => m.CoreCoursesHomePageModule),
            },
        ],
    },
];

const routes: Routes = [
    {
        path: '',
        component: CoreMainMenuPage,
        children: [
            {
                path: '',
                loadChildren: () => import('../courses/pages/home/home.page.module').then(m => m.CoreCoursesHomePageModule),
            },
            {
                path: 'more',
                children: [
                    {
                        path: '',
                        component: CoreMainMenuMorePage,
                    },
                    { path: 'settings', children: settingsRoutes },
                    // ...childRoutes,
                ],
            },

            // Would be nice to do it the other way around, but ion-tabs doesn't allow it (incorrect higlight :/)...
            {
                path: 'home',
                redirectTo: '',
            },
            // ...childRoutes,
        ],
    },
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule],
})
export class CoreMainMenuRoutingModule { }
