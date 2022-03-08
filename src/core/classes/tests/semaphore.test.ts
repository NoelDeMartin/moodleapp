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

import { CoreSemaphore } from '../semaphore';

describe('Semaphore', () => {

    it('Locks concurrent threads', async () => {
        // Arrange.
        class Writer {

            private pen?: Promise<void>;

            async write(item: string): Promise<void> {
                this.pen = this.pen ?? lock.acquire();

                await this.pen;

                items.push(item);
            }

            releasePen(): void {
                if (!this.pen)
                {return;}

                lock.release();

                delete this.pen;
            }

        }

        const items: string[] = [];
        const lock = new CoreSemaphore();
        const writers = [new Writer(), new Writer()];

        // Act.
        const promises: Promise<void>[] = [];
        promises.push(writers[0].write('one'));
        promises.push(writers[1].write('two'));
        promises.push(writers[0].write('three'));
        writers[1].releasePen();
        writers[0].releasePen();

        await Promise.all(promises);

        // Assert.
        expect(items).toEqual(['one', 'three', 'two']);
    });

});
