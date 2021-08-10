package com.moodle.moodlemobile;

import androidx.annotation.Nullable;
import androidx.work.Data;
import androidx.work.OneTimeWorkRequest;
import androidx.work.WorkManager;
import androidx.work.WorkRequest;

import org.apache.cordova.CordovaPlugin;
import org.apache.cordova.CallbackContext;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.util.UUID;

public class WebServicesQueue extends CordovaPlugin {

    @Override
    public boolean execute(String action, JSONArray args, CallbackContext callbackContext) throws JSONException {
        try {
            switch (action) {
                case "start-request":
                    JSONObject data = args.getJSONObject(0);
                    String id = this.startRequest(
                        data.getString("url"),
                        data.has("title") ? data.getString("title") : null
                    );

                    callbackContext.success(id);

                    return true;
                case "consume-request":
                    // TODO remove request data from preferences

                    return true;
                case "get-requests":
                    JSONArray requests = this.getRequests();

                    callbackContext.success(requests);

                    return true;
            }
        } catch (Throwable e) {
            callbackContext.error(e.getMessage());

            return true;
        }

        return false;
    }

    private String startRequest(String url, @Nullable String title) {
        String id = UUID.randomUUID().toString();

        Data.Builder builder = new Data.Builder();
        builder.putString(WebServicesWorker.PARAMETER_ID, id);
        builder.putString(WebServicesWorker.PARAMETER_URL, url);

        if (title != null) {
            builder.putString(WebServicesWorker.PARAMETER_TITLE, title);
        }

        WorkRequest workRequest = new OneTimeWorkRequest.Builder(WebServicesWorker.class)
            .setInputData(builder.build())
            .build();

        WorkManager.getInstance(this.cordova.getContext().getApplicationContext()).enqueue(workRequest);

        return id;
    }

    private JSONArray getRequests() throws JSONException {
        return WebServicesWorker.getStoredRequests(this.cordova.getContext().getApplicationContext());
    }

}
