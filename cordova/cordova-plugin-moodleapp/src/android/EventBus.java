package com.moodle.moodlemobile;

import androidx.annotation.Nullable;

import com.google.android.gms.common.util.IOUtils;

import org.apache.cordova.CordovaPlugin;
import org.apache.cordova.CallbackContext;

import org.apache.cordova.PluginResult;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.io.BufferedInputStream;
import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.StringWriter;
import java.net.HttpURLConnection;
import java.net.MalformedURLException;
import java.net.URL;
import java.net.URLConnection;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;

public class EventBus extends CordovaPlugin {

    private static ArrayList<CallbackContext> listeners = new ArrayList();

    @Override
    public boolean execute(String action, JSONArray args, CallbackContext callbackContext) throws JSONException {
        switch (action) {
            case "listen":
                this.listen(callbackContext);

                return true;
        }

        return false;
    }

    public static void trigger(String event, @Nullable Object data) {
        for (CallbackContext listener: listeners) {
            EventBus.sendEvent(listener, event, data);
        }
    }

    private static void listen(CallbackContext listener) {
        EventBus.sendEvent(listener, "ready", null);
        EventBus.listeners.add(listener);
    }

    private static void sendEvent(CallbackContext listener, String event, @Nullable Object data) {
        JSONObject payload = new JSONObject();
        try {
            payload.put("event", event);

            if (data != null)
                payload.put("data", data);

            PluginResult result = new PluginResult(PluginResult.Status.OK, payload);

            result.setKeepCallback(true);
            listener.sendPluginResult(result);
        } catch (JSONException e) {
            System.out.println("EVENT_BUS: error sending event " + e.getMessage());
        }
    }

}
