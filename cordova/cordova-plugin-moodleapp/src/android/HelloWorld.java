package com.moodle.moodlemobile;

import org.apache.cordova.CordovaPlugin;
import org.apache.cordova.CallbackContext;

import org.json.JSONArray;
import org.json.JSONException;

public class HelloWorld extends CordovaPlugin {

    @Override
    public boolean execute(String action, JSONArray args, CallbackContext callbackContext) throws JSONException {
        switch (action) {
            case "hello":
                String message = args.getString(0);
                String result = this.hello(message);

                callbackContext.success(result);

                return true;
        }

        return false;
    }

    private String hello(String name) {
        return "Hello " + name + "!";
    }

}
