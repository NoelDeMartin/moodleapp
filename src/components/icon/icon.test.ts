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

import { CoreIconComponent } from './icon';

import { IonicModule } from 'ionic-angular';
import { TestBed } from '@angular/core/testing';

describe('CoreIconComponent', () => {

    beforeEach(() => {
        TestBed.configureTestingModule({
            declarations: [CoreIconComponent],
            imports: [
                IonicModule.forRoot(CoreIconComponent),
            ],
        });
    });

    it('should render', async () => {
        const fixture = TestBed.createComponent(CoreIconComponent);
        const element = fixture.nativeElement;

        fixture.detectChanges();

        expect(element.innerHTML.trim()).not.toHaveLength(0);
    });

});
