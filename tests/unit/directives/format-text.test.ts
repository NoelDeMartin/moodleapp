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

import { CoreFormatTextDirective } from '@directives/format-text';

import { CoreAppProvider } from '@providers/app';
import { CoreContentLinksHelperProvider } from '@core/contentlinks/providers/helper';
import { CoreDomUtilsProvider } from '@providers/utils/dom';
import { CoreEventsProvider } from '@providers/events';
import { CoreFilepoolProvider } from '@providers/filepool';
import { CoreFilterDelegate } from '@core/filter/providers/delegate';
import { CoreFilterHelperProvider } from '@core/filter/providers/helper';
import { CoreFilterProvider } from '@core/filter/providers/filter';
import { CoreIframeUtilsProvider } from '@providers/utils/iframe';
import { CoreLoggerProvider } from '@providers/logger';
import { CoreSite } from '@classes/site';
import { CoreSitesProvider } from '@providers/sites';
import { CoreSplitViewComponent } from '@components/split-view/split-view';
import { CoreTextUtilsProvider } from '@providers/utils/text';
import { CoreUrlUtilsProvider } from '@providers/utils/url';
import { CoreUtilsProvider } from '@providers/utils/utils';
import { TranslateService } from '@ngx-translate/core';
import { when, anything, verify, instance, mock } from '@testing/mocking';
import ComponentTestCase from '@testing/ComponentTestCase';
import CoreDomUtilsProviderStub from '@testing/stubs/providers/utils/dom';
import CoreLoggerProviderStub from '@testing/stubs/providers/logger';

describe('CoreFormatTextDirective', () => {

    it('should render', async () => {
        // Arrange
        const test = prepareTest('<core-format-text text="Lorem ipsum dolor"></core-format-text>');

        withoutSite(test);
        withoutTextFormatting(test);

        // Act
        const element = test.render();

        await test.whenAsyncOperationsFinished();

        // Assert
        expect(element.innerHTML.trim()).not.toHaveLength(0);
        expect(element.children[0].innerHTML).toEqual('Lorem ipsum dolor');
    });

    it('should format text', async () => {
        // Arrange
        const test = prepareTest('<core-format-text text="Lorem ipsum dolor"></core-format-text>');
        const filterProvider = test.getDependencyMock(CoreFilterProvider);

        when(filterProvider.formatText(anything(), anything(), anything(), anything()))
            .thenReturn(test.resolvedAsyncOperation('Formatted text'));

        withoutSite(test);

        // Act
        const element = test.render();

        await test.whenAsyncOperationsFinished();

        // Assert
        expect(element.innerHTML.trim()).not.toHaveLength(0);
        expect(element.children[0].innerHTML).toEqual('Formatted text');

        verify(filterProvider.formatText('Lorem ipsum dolor', anything(), anything(), anything())).once();
    });

    it('should get filters from server and format text', async () => {
        // Arrange
        const test = prepareTest(`
            <core-format-text
                text="Lorem ipsum dolor"
                contextLevel="course"
                [contextInstanceId]="42"
            ></core-format-text>
        `);
        const filterHelper = test.getDependencyMock(CoreFilterHelperProvider);

        when(filterHelper.getFiltersAndFormatText(anything(), anything(), anything(), anything(), anything()))
            .thenReturn(test.resolvedAsyncOperation({
                text: 'Formatted text',
                filters: [],
            }));

        withoutSite(test);

        // Act
        const element = test.render();

        await test.whenAsyncOperationsFinished();

        // Assert
        expect(element.innerHTML.trim()).not.toHaveLength(0);
        expect(element.children[0].innerHTML).toEqual('Formatted text');

        verify(filterHelper.getFiltersAndFormatText('Lorem ipsum dolor', 'course', 42, anything(), anything())).once();
    });

    it('should use external-content directive on images', async () => {
        // Arrange
        const test = prepareTest(`
            <core-format-text
                text="&lt;img src=&quot;https://online-url&quot;/&gt;"
                siteId="42"
            ></core-format-text>
        `);
        const sitesProvider = test.getDependencyMock(CoreSitesProvider);
        const filepoolProvider = test.getDependencyMock(CoreFilepoolProvider);
        const site = mock(CoreSite);

        when(sitesProvider.getSite(anything())).thenReturn(test.resolvedAsyncOperation(instance(site)));

        when(filepoolProvider.getSrcByUrl(anything(), anything(), anything(), anything(), anything(), anything(), anything()))
            .thenReturn(test.resolvedAsyncOperation('file://local-path/'));

        when(site.canDownloadFiles()).thenReturn(true);

        withoutTextFormatting(test);
        withoutTimeouts(test);

        // Act
        const element = test.render();

        await test.whenAsyncOperationsFinished();

        // Assert
        expect(element.innerHTML.trim()).not.toHaveLength(0);

        const image = element.querySelector('img');
        expect(image).not.toBeNull();
        expect(image.src).toEqual('file://local-path/');

        verify(sitesProvider.getSite('42')).called();
        verify(
            filepoolProvider.getSrcByUrl(
                '42', 'https://online-url',
                anything(), anything(), anything(), anything(), anything(),
            ),
        ).once();
    });

});

type TestCase = ComponentTestCase<CoreFormatTextDirective>;

function prepareTest(template: string): TestCase {
    const test = new ComponentTestCase(CoreFormatTextDirective, {
        template,
        dependencies: [
            CoreSitesProvider,
            CoreTextUtilsProvider,
            TranslateService,
            CoreUtilsProvider,
            CoreUrlUtilsProvider,
            CoreFilepoolProvider,
            CoreAppProvider,
            CoreContentLinksHelperProvider,
            CoreSplitViewComponent,
            CoreIframeUtilsProvider,
            CoreEventsProvider,
            CoreFilterProvider,
            CoreFilterHelperProvider,
            CoreFilterDelegate,
        ],
    });

    test.configureTestingModule({
        providers: [
            { provide: CoreDomUtilsProvider, useValue: new CoreDomUtilsProviderStub() },
            { provide: CoreLoggerProvider, useValue: new CoreLoggerProviderStub() },
        ],
    });

    return test;
}

function withoutSite(test: TestCase): void {
    const sitesProvider = test.getDependencyMock(CoreSitesProvider);

    when(sitesProvider.getSite(anything())).thenReturn(test.rejectedAsyncOperation());
}

function withoutTextFormatting(test: TestCase): void {
    const filterProvider = test.getDependencyMock(CoreFilterProvider);
    const filterHelper = test.getDependencyMock(CoreFilterHelperProvider);

    when(filterProvider.formatText(anything(), anything(), anything(), anything())).thenCall((text) => {
        return test.resolvedAsyncOperation(text);
    });

    when(filterHelper.getFiltersAndFormatText(anything(), anything(), anything(), anything(), anything())).thenCall((text) => {
        return test.resolvedAsyncOperation({
            text,
            filters: [],
        });
    });
}

function withoutTimeouts(test: TestCase): void {
    const utils = test.getDependencyMock(CoreUtilsProvider);

    when(utils.timeoutPromise(anything(), anything())).thenReturn(test.resolvedAsyncOperation());
}
