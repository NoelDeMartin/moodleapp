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

import androidx.annotation.Nullable;

import org.apache.cordova.CordovaPlugin;
import org.apache.cordova.CallbackContext;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.PrintWriter;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.UUID;

public class WebServiceRequestsQueue extends CordovaPlugin {

    private static final String TAG = "WebServiceRequestsQueue";

    @Override
    public boolean execute(String action, JSONArray args, CallbackContext callbackContext) {
        try {
            switch (action) {
                case "startRequest":
                    String method = args.getString(0);
                    String url = args.getString(1);
                    String body = args.isNull(2) ? null : args.getString(2);

                    callbackContext.success(this.startRequest(method, url, body));

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

    private JSONObject startRequest(String method, String url, @Nullable String body) throws JSONException {
        JSONObject request = new JSONObject();
        String id = UUID.randomUUID().toString();

        request.put("id", id);
        request.put("status", "ongoing");

        // TODO move to worker
        Handler handler = new Handler();
        handler.postDelayed(new Runnable() {
            public void run() {
                try {
                    WebServiceRequestsQueue.this.processRequest(id, method, url, body);
                } catch (Throwable e) {
                    try {
                        JSONObject payload = new JSONObject();

                        payload.put("id", id);

                        EventBus.emit("request-failed", payload);
                    } catch (JSONException jsonException) {
                        Log.e(TAG, "Failed sending failure payload: " + url, e);
                    }
                }
            }
        }, 100);

        return request;
    }

    private JSONArray getRequests() {
        JSONArray requests = new JSONArray();

        // TODO

        return requests;
    }

    // TODO move to worker
    private void processRequest(String id, String method, String url, @Nullable String body) throws IOException, JSONException {
        HttpURLConnection connection = (HttpURLConnection) new URL(url).openConnection();
        connection.setRequestMethod(method.toUpperCase());

        if (body != null) {
            connection.setDoOutput(true);

            new PrintWriter(connection.getOutputStream()).write(body);
        }

        try {
            String line;
            BufferedReader reader = new BufferedReader(new InputStreamReader(connection.getInputStream()));
            StringBuilder stringBuilder = new StringBuilder();
            while ((line = reader.readLine()) != null) {
                stringBuilder.append(line);
            }
            reader.close();

            JSONObject response = new JSONObject();
            JSONObject payload = new JSONObject();

            response.put("statusCode", connection.getResponseCode());
            response.put("data", stringBuilder.toString());
            payload.put("id", id);
            payload.put("response", response);

            EventBus.emit("request-completed", payload);
        } finally {
            connection.disconnect();
        }
    }

}
