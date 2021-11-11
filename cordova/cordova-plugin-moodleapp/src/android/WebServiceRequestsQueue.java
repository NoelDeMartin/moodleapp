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

import android.os.Handler;
import android.util.Log;

import org.apache.cordova.CordovaPlugin;
import org.apache.cordova.CallbackContext;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.util.UUID;

public class WebServiceRequestsQueue extends CordovaPlugin {

    private static final String TAG = "WebServiceRequestsQueue";

    @Override
    public boolean execute(String action, JSONArray args, CallbackContext callbackContext) {
        try {
            switch (action) {
                case "startRequest":
                    String url = args.getString(0);

                    callbackContext.success(this.startRequest(url));

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

    private JSONObject startRequest(String url) throws JSONException {
        JSONObject request = new JSONObject();
        String id = UUID.randomUUID().toString();

        request.put("id", id);
        request.put("status", "ongoing");

        // TODO move to worker and process real request
        Handler handler = new Handler();
        handler.postDelayed(new Runnable() {
            public void run() {
                try {
                    JSONObject payload = new JSONObject();

                    payload.put("id", id);

                    EventBus.emit("request-completed", payload);
                } catch (JSONException e) {
                    Log.e(TAG, "Failed processing request: " + url, e);
                }
            }
        }, 3000);

        return request;
    }

    private JSONArray getRequests() {
        JSONArray requests = new JSONArray();

        // TODO

        return requests;
    }

}
