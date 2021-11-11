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

import androidx.annotation.Nullable;

import org.apache.cordova.CordovaPlugin;
import org.apache.cordova.CallbackContext;

import org.apache.cordova.PluginResult;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.util.ArrayList;

public class EventBus extends CordovaPlugin {

    private static final String TAG = "EventBus";

    private static CallbackContext applicationListener;
    private static ArrayList<QueuedEvent> queuedEvents = new ArrayList<>();

    public static void emit(String event, @Nullable Object data) {
        if (EventBus.applicationListener == null) {
            EventBus.queuedEvents.add(new QueuedEvent(event, data));

            return;
        }

        try {
            JSONObject payload = new JSONObject();

            payload.put("event", event);

            if (data != null) {
                payload.put("data", data);
            }

            PluginResult result = new PluginResult(PluginResult.Status.OK, payload);

            result.setKeepCallback(true);
            EventBus.applicationListener.sendPluginResult(result);
        } catch (JSONException e) {
            Log.e(TAG, "Failed emitting event: " + event, e);
        }
    }

    @Override
    public boolean execute(String action, JSONArray args, CallbackContext callbackContext) {
        try {
            switch (action) {
                case "init":
                    this.init(callbackContext);

                    return true;
            }
        } catch (Throwable e) {
            Log.e(TAG, "Failed executing action: " + action, e);
        }

        return false;
    }

    private void init(CallbackContext listener) {
        EventBus.applicationListener = listener;

        EventBus.emit("ready", null);

        while (EventBus.queuedEvents.size() > 0) {
            QueuedEvent event = EventBus.queuedEvents.remove(0);

            EventBus.emit(event.name, event.data);
        }
    }

}
