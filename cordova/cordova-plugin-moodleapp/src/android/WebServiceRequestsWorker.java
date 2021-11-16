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

import android.content.Context;
import android.content.SharedPreferences;
import android.util.Log;

import androidx.work.Data;
import androidx.work.OneTimeWorkRequest;
import androidx.work.WorkManager;
import androidx.work.WorkRequest;
import androidx.work.Worker;
import androidx.work.WorkerParameters;

import org.json.JSONException;
import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.ArrayList;
import java.util.Iterator;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

public class WebServiceRequestsWorker extends Worker {

    private static final String TAG = "WSRequestsWorker";

    private static String PARAMETER_REQUEST_ID = "REQUEST_ID";
    private static String PARAMETER_REQUEST_URL = "REQUEST_URL";
    private static String PARAMETER_REQUEST_OPTIONS = "REQUEST_OPTIONS";

    private static String STORAGE_KEY = "WEB_SERVICE_REQUESTS";

    public static WebServiceRequest startRequest(Context context, String url, JSONObject optionsJson) throws JSONException {
        String id = UUID.randomUUID().toString();
        WebServiceRequest.Options options = WebServiceRequest.Options.fromJSONObject(optionsJson);
        WebServiceRequest request = new WebServiceRequest(id, WebServiceRequest.Status.ONGOING, options.metadata);

        WebServiceRequestsWorker.storeRequest(context, request);
        WebServiceRequestsWorker.launch(context, request, url, options);

        return request;
    }

    private static void launch(Context context, WebServiceRequest request, String url, WebServiceRequest.Options options) throws JSONException {
        Data.Builder builder = new Data.Builder();
        builder.putString(PARAMETER_REQUEST_ID, request.id);
        builder.putString(PARAMETER_REQUEST_URL, url);
        builder.putString(PARAMETER_REQUEST_OPTIONS, options.toJSON().toString());

        WorkRequest workRequest = new OneTimeWorkRequest.Builder(WebServiceRequestsWorker.class)
            .setInputData(builder.build())
            .build();

        WorkManager.getInstance(context.getApplicationContext()).enqueue(workRequest);
    }

    // TODO consider alternative storages
    public static void storeRequest(Context context, WebServiceRequest request) throws JSONException {
        SharedPreferences preferences = context.getSharedPreferences(STORAGE_KEY, Context.MODE_PRIVATE);
        SharedPreferences.Editor editor = preferences.edit();
        editor.putString(request.id, request.toJSON().toString());
        editor.apply();
    }

    public static WebServiceRequest getStoredRequest(Context context, String id) throws JSONException {
        SharedPreferences preferences = context.getSharedPreferences(STORAGE_KEY, Context.MODE_PRIVATE);
        String json = preferences.getString(id, null);

        if (json == null) {
            return null;
        }

        return WebServiceRequest.fromJSON(json);
    }

    public static ArrayList<WebServiceRequest> getStoredRequests(Context context) throws JSONException {
        SharedPreferences preferences = context.getSharedPreferences(STORAGE_KEY, Context.MODE_PRIVATE);
        Set<? extends Map.Entry<String, ?>> entries = preferences.getAll().entrySet();
        ArrayList<WebServiceRequest> requests = new ArrayList(entries.size());

        for (Map.Entry<String, ?> entry: entries) {
            requests.add(WebServiceRequest.fromJSON((String) entry.getValue()));
        }

        return requests;
    }

    private String requestId;
    private String requestUrl;
    private WebServiceRequest.Options requestOptions;

    public WebServiceRequestsWorker(Context context, WorkerParameters workerParams) throws JSONException {
        super(context, workerParams);

        Data input = workerParams.getInputData();

        this.requestId = input.getString(PARAMETER_REQUEST_ID);
        this.requestUrl = input.getString(PARAMETER_REQUEST_URL);
        this.requestOptions = WebServiceRequest.Options.fromJSONObject(new JSONObject(input.getString(PARAMETER_REQUEST_OPTIONS)));
    }

    @Override
    public Result doWork() {
        try {
            WebServiceRequest.Response response = this.processRequest();

            this.onRequestCompleted(response);
        } catch (Throwable error) {
            this.onRequestFailed();
        }

        return null;
    }

    private WebServiceRequest.Response processRequest() throws IOException, JSONException {
        HttpURLConnection connection = (HttpURLConnection) new URL(this.requestUrl).openConnection();

        if (this.requestOptions.method != null) {
            connection.setRequestMethod(this.requestOptions.method);
        }

        if (this.requestOptions.headers != null) {
            Iterator<String> keys = this.requestOptions.headers.keys();

            while (keys.hasNext()) {
                String header = keys.next();

                connection.setRequestProperty(header, this.requestOptions.headers.getString(header));
            }
        }

        if (this.requestOptions.body != null) {
            connection.setDoOutput(true);

            OutputStream outputStream = connection.getOutputStream();
            outputStream.write(this.requestOptions.body.getBytes());
            outputStream.flush();
        }

        try {
            String line;
            BufferedReader reader = new BufferedReader(new InputStreamReader(connection.getInputStream()));
            StringBuilder stringBuilder = new StringBuilder();
            while ((line = reader.readLine()) != null) {
                stringBuilder.append(line);
            }
            reader.close();

            return new WebServiceRequest.Response(connection.getResponseCode(), stringBuilder.toString());
        } finally {
            connection.disconnect();
        }
    }

    private void onRequestCompleted(WebServiceRequest.Response response) throws JSONException {
        // Update request in storage.
        WebServiceRequest request = WebServiceRequestsWorker.getStoredRequest(this.getApplicationContext(), this.requestId);

        request.status = WebServiceRequest.Status.COMPLETED;
        request.response = response;

        WebServiceRequestsWorker.storeRequest(this.getApplicationContext(), request);

        // Emit completed event.
        JSONObject payload = new JSONObject();

        payload.put("id", this.requestId);
        payload.put("response", response.toJSON());

        EventBus.emit("request-completed", payload);
    }

    private void onRequestFailed() {
        try {
            // Update request in storage.
            WebServiceRequest request = WebServiceRequestsWorker.getStoredRequest(this.getApplicationContext(), this.requestId);

            request.status = WebServiceRequest.Status.FAILED;

            WebServiceRequestsWorker.storeRequest(this.getApplicationContext(), request);

            // Emit failed event.
            JSONObject payload = new JSONObject();

            payload.put("id", this.requestId);

            EventBus.emit("request-failed", payload);
        } catch (JSONException jsonException) {
            Log.e(TAG, "Failed sending failure for url " + this.requestUrl, jsonException);
        }
    }

}
