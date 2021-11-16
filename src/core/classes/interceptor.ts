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
import { HttpInterceptor, HttpHandler, HttpRequest } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CoreUrl } from '@singletons/url';

/**
 * Interceptor for Http calls. Adds the header 'Content-Type'='application/x-www-form-urlencoded'
 * and serializes the parameters if needed.
 */
@Injectable()
export class CoreInterceptor implements HttpInterceptor {

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    intercept(req: HttpRequest<any>, next: HttpHandler): Observable<any> {
        // Add the header and serialize the body if needed.
        const newReq = req.clone({
            headers: req.headers.set('Content-Type', 'application/x-www-form-urlencoded'),
            body: typeof req.body == 'object' && String(req.body) != '[object File]' ?
                CoreUrl.encodeObject(req.body) : req.body,
        });

        // Pass on the cloned request instead of the original request.
        return next.handle(newReq);
    }

}
