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

import { Injectable } from '@angular/core';
import { makeSingleton } from '@singletons';

/**
 * Utilities to cast values.
 */
@Injectable({ providedIn: 'root' })
export class CoreCastingUtilsService {

    /**
     * Return true if the param is false (bool), 0 (number) or "0" (string).
     *
     * @param value Value to check.
     * @return Whether the value is false, 0 or "0".
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    isFalseOrZero(value: any): boolean {
        return value !== undefined && (value === false || value === 'false' || parseInt(value, 10) === 0);
    }

}

export const CoreCastingUtils = makeSingleton(CoreCastingUtilsService);
