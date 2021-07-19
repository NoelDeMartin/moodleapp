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

import { ActivatedRoute } from '@angular/router';
import { AfterViewInit, Component, ViewChild } from '@angular/core';
import { isPromise } from '@angular/compiler/src/util';

import { ChangeDetector } from '@singletons';
import { CoreCompileHtmlComponent } from '@features/compile/components/compile-html/compile-html';
import { CoreSitePluginsComponent } from '@features/siteplugins/public-api';
import { CoreSitePluginsPlugin } from '@features/siteplugins/services/siteplugins';

/**
 * Page to render site plugin component.
 */
@Component({
    selector: 'page-core-siteplugins-plugin-component',
    templateUrl: 'plugin-component.html',
})
export class CoreSitePluginsPluginComponentPage implements AfterViewInit {

    title = '';
    text = '';
    jsData: Record<string, unknown> = {};
    plugin?: CoreSitePluginsPlugin = undefined;

    @ViewChild(CoreCompileHtmlComponent) htmlComponent!: CoreCompileHtmlComponent;

    constructor(protected route: ActivatedRoute) {
        const SitePluginComponent = route.snapshot.data.component as CoreSitePluginsComponent;

        if (!SitePluginComponent?.template) {
            return;
        }

        this.title = SitePluginComponent.title ?? '';
        this.text = SitePluginComponent.template;
        this.jsData = this.getInstanceData(new SitePluginComponent());
        this.plugin = route.snapshot.data.pluginName;

        this.watchChanges();
    }

    /**
     * @inheritdoc
     */
    ngAfterViewInit(): void {
        this.htmlComponent.callComponentFunction('onInit');
    }

    /**
     * Get plugin component data.
     *
     * @param instance Plugin component instance.
     * @returns Data.
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private getInstanceData(instance: any): Record<string, unknown> {
        const data = {};

        let prototype = instance;

        while (prototype.constructor !== Object) {
            for (const prop of Object.getOwnPropertyNames(prototype)) {
                data[prop] = instance[prop];
            }

            prototype = Object.getPrototypeOf(prototype);
        }

        return data;
    }

    /**
     * Watch component changes and trigger change detector.
     */
    private watchChanges(): void {
        for (const [prop, value] of Object.entries(this.jsData)) {
            if (typeof value !== 'function') {
                continue;
            }

            this.jsData[prop] = function (...args) {
                const result = value.call(this, ...args);

                if (isPromise(result)) {
                    return result.then(r => {
                        ChangeDetector.detectChanges();

                        return r;
                    });
                }

                ChangeDetector.detectChanges();

                return result;
            };
        }
    }

}
