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
import { RouterModule, Routes, Route } from '@angular/router';

import { CoreMainMenuPage } from './pages/menu/menu.page';
import { CoreMainMenuMorePage } from './pages/more/more.page';

export const addRouteToTabs = (route: Route): void => {
    // Add them both in tabs and in more page since a tab can be displayed in both places.
    TABS_ROUTES.push(route);
    MORE_PAGE_ROUTES.push(route);
};

const MORE_PAGE_ROUTES: Routes = [
    {
        path: '',
        component: CoreMainMenuMorePage,
    },
];

const TABS_ROUTES: Routes = [
    {
        path: 'more',
        children: MORE_PAGE_ROUTES,
    },
];

const routes: Routes = [
    {
        path: '',
        component: CoreMainMenuPage,
        children: TABS_ROUTES,
    },
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule],
})
export class CoreMainMenuRoutingModule {}
