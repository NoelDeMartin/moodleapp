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

import androidx.annotation.Nullable;

import org.json.JSONException;
import org.json.JSONObject;

public class WebServiceRequest {

    enum Status {
        ONGOING,
        COMPLETED,
        FAILED
    }

    static class Options {

        public static Options fromJSONObject(JSONObject json) throws JSONException {
            return new Options(
                json.getString("method"),
                json.getString("body"),
                (JSONObject) json.get("headers"),
                (JSONObject) json.get("metadata")
            );
        }

        public @Nullable String method;
        public @Nullable String body;
        public @Nullable JSONObject headers;
        public @Nullable JSONObject metadata;

        public Options(
            @Nullable String method,
            @Nullable String body,
            @Nullable JSONObject headers,
            @Nullable JSONObject metadata
        ) {
            this.method = method;
            this.body = body;
            this.headers = headers;
            this.metadata = metadata;
        }

        public JSONObject toJSON() throws JSONException {
            JSONObject json = new JSONObject();

            json.put("method", this.method);
            json.put("body", this.body);
            json.put("headers", this.headers);
            json.put("metadata", this.metadata);

            return json;
        }

    }

    static class Response {

        public int statusCode;
        public String body;

        public Response(int statusCode, String body) {
            this.statusCode = statusCode;
            this.body = body;
        }

        public JSONObject toJSON() throws JSONException {
            JSONObject json = new JSONObject();

            json.put("statusCode", this.statusCode);
            json.put("body", this.body);

            return json;
        }

    }

    public static WebServiceRequest fromJSON(String rawJson) throws JSONException {
        JSONObject json = new JSONObject(rawJson);

        return new WebServiceRequest(
            json.getString("id"),
            WebServiceRequest.stringToStatus(json.getString("status")),
            json.get("metadata")
        );
    }

    private static Status stringToStatus(String status) {
        switch (status) {
            case "ongoing":
                return Status.ONGOING;
            case "completed":
                return Status.COMPLETED;
            case "failed":
                return Status.FAILED;
            default:
                return null;
        }
    }

    private static String statusToString(Status status) {
        switch (status) {
            case ONGOING:
                return "ongoing";
            case COMPLETED:
                return "completed";
            case FAILED:
                return "failed";
            default:
                return null;
        }
    }

    public String id;
    public Status status;
    public Object metadata;
    public @Nullable Response response;

    public WebServiceRequest(String id, Status status, Object metadata) {
        this.id = id;
        this.status = status;
        this.metadata = metadata;
    }

    public JSONObject toJSON() throws JSONException {
        JSONObject json = new JSONObject();

        json.put("id", this.id);
        json.put("status", WebServiceRequest.statusToString(this.status));
        json.put("metadata", this.metadata);

        if (this.response != null) {
            json.put("response", this.response.toJSON());
        }

        return json;
    }

}
