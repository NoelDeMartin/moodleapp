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

package com.moodle.moodlemobile;

import android.util.Log;

import org.apache.cordova.CordovaPlugin;
import org.apache.cordova.CallbackContext;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.util.ArrayList;

public class WebServiceRequestsQueue extends CordovaPlugin {

    private static final String TAG = "WebServiceRequestsQueue";

    @Override
    public boolean execute(String action, JSONArray args, CallbackContext callbackContext) {
        try {
            switch (action) {
                case "startRequest":
                    String url = args.getString(0);
                    JSONObject options = (JSONObject) args.get(1);

                    callbackContext.success(this.startRequest(url, options));

                    return true;
                case "getRequests":
                    callbackContext.success(this.getRequests());

                    return true;
            }
        } catch (Throwable e) {
            Log.e(TAG, "Failed executing action: " + action, e);
        }

        return false;
    }

    private JSONObject startRequest(String url, JSONObject options) throws JSONException {
        WebServiceRequest request = WebServiceRequestsWorker.startRequest(
            this.cordova.getContext(),
            url,
            options
        );

        return request.toJSON();
    }

    private JSONArray getRequests() throws JSONException {
        JSONArray requestsJson = new JSONArray();
        ArrayList<WebServiceRequest> requests = WebServiceRequestsWorker.getStoredRequests(this.cordova.getContext());

        for (WebServiceRequest request: requests) {
            requestsJson.put(request.toJSON());
        }

        return requestsJson;
    }

}
