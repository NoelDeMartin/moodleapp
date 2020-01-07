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
import { CoreSitesProvider } from '@providers/sites';
import { CoreSplitViewComponent } from '@components/split-view/split-view';
import { CoreTextUtilsProvider } from '@providers/utils/text';
import { CoreUrlUtilsProvider } from '@providers/utils/url';
import { CoreUtilsProvider } from '@providers/utils/utils';
import { TranslateService } from '@ngx-translate/core';
import { when, anything, verify } from 'ts-mockito';
import ComponentTestCase from '@testing/ComponentTestCase';

const test = new ComponentTestCase(CoreFormatTextDirective, {
    template: '<core-format-text text="Lorem ipsum dolor"></core-format-text>',
    dependencies: [
        CoreSitesProvider,
        CoreDomUtilsProvider,
        CoreTextUtilsProvider,
        TranslateService,
        CoreUtilsProvider,
        CoreUrlUtilsProvider,
        CoreLoggerProvider,
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

describe('CoreFormatTextDirective', () => {

    beforeEach(() => {
        test.reset();
        test.configureTestingModule();
    });

    it('should render', async () => {
        // Arrange
        const sitesProvider = test.getDependencyMock(CoreSitesProvider);
        const domUtils = test.getDependencyMock(CoreDomUtilsProvider);
        const filterProvider = test.getDependencyMock(CoreFilterProvider);

        when(sitesProvider.getSite(anything())).thenReturn(test.rejectedAsyncOperation());
        when(domUtils.moveChildren(anything(), anything())).thenCall(moveChildren);
        when(filterProvider.formatText(anything(), anything(), anything(), anything())).thenCall((text) => {
            return test.resolvedAsyncOperation(text);
        });

        // Act
        const element = test.render();

        await test.whenAsyncOperationsFinished();

        // Assert
        expect(element.innerHTML.trim()).not.toHaveLength(0);
        expect(element.children[0].innerHTML).toEqual('Lorem ipsum dolor');

        verify(filterProvider.formatText('Lorem ipsum dolor', anything(), anything(), anything())).once();
    });

});

function moveChildren(oldParent: HTMLElement, newParent: HTMLElement, prepend?: boolean): Node[] {
    const movedChildren: Node[] = [];
    const referenceNode = prepend ? newParent.firstChild : null;

    while (oldParent.childNodes.length > 0) {
        const child = oldParent.childNodes[0];
        movedChildren.push(child);

        newParent.insertBefore(child, referenceNode);
    }

    return movedChildren;
}
