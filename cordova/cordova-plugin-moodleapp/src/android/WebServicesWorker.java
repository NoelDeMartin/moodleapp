package com.moodle.moodlemobile;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.content.Context;
import android.content.SharedPreferences;
import android.os.Build;

import androidx.annotation.NonNull;
import androidx.core.app.NotificationCompat;
import androidx.core.app.NotificationManagerCompat;
import androidx.work.ForegroundInfo;
import androidx.work.Worker;
import androidx.work.WorkerParameters;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;

public class WebServicesWorker extends Worker {

    public static String PARAMETER_ID = "ID";
    public static String PARAMETER_URL = "URL";
    public static String PARAMETER_TITLE = "TITLE";

    private static String PREFERENCES_KEY = "WEB_SERVICES";
    private static String PREFERENCES_MAX_NOTIFICATION_ID_KEY = "MAX_NOTIFICATION_ID";
    private static String NOTIFICATIONS_CHANNEL = "WEB_SERVICES";

    private static int MAX_PROGRESS = 25;

    public static JSONArray getStoredRequests(Context context) throws JSONException {
        SharedPreferences preferences = context.getSharedPreferences(PREFERENCES_KEY, Context.MODE_PRIVATE);
        JSONArray requests = new JSONArray();

        for (Map.Entry<String, ?> entry: preferences.getAll().entrySet()) {
            String key = entry.getKey();

            if (key.equals(PREFERENCES_MAX_NOTIFICATION_ID_KEY)) {
                continue;
            }

            JSONObject request = new JSONObject();
            JSONObject data = new JSONObject((String) entry.getValue());

            request.put("id", key);
            request.put("url", data.getString("url"));

            if (data.has("response")) {
                request.put("response", data.getJSONObject("response"));
            }

            requests.put(request);
        }

        return requests;
    }

    private static void storeRequest(Context context, String id, String url, JSONObject response) throws JSONException {
        JSONObject data = new JSONObject();
        data.put("url", url);

        if (response != null) {
            data.put("response", response);
        }

        SharedPreferences preferences = context.getSharedPreferences(PREFERENCES_KEY, Context.MODE_PRIVATE);
        SharedPreferences.Editor editor = preferences.edit();
        editor.putString(id, data.toString());
        editor.apply();
    }

    private static void notifyResolvedResponse(String id, JSONObject response) throws JSONException {
        JSONObject data = new JSONObject();
        data.put("id", id);
        data.put("response", response);

        EventBus.trigger("webservicesqueue:success", data);
    }

    private String notificationTitle;
    private int notificationId;
    private int progress;

    public WebServicesWorker(@NonNull Context context, @NonNull WorkerParameters workerParams) {
        super(context, workerParams);

        this.progress = 0;
        this.notificationId = this.generateNotificationId(context);

        String notificationTitle = workerParams.getInputData().getString(PARAMETER_TITLE);
        if (notificationTitle == null) {
            this.notificationTitle = "Web Service request";
        } else {
            this.notificationTitle = notificationTitle;
        }
    }

    @NonNull
    @Override
    public Result doWork() {
        this.updateNotificationInProgress();

        try {
            String id = this.getInputData().getString(PARAMETER_ID);
            String url = this.getInputData().getString(PARAMETER_URL);

            WebServicesWorker.storeRequest(this.getApplicationContext(), id, url, null);

            HttpURLConnection connection = (HttpURLConnection) new URL(url).openConnection();

            try {
                String line;
                BufferedReader reader = new BufferedReader(new InputStreamReader(connection.getInputStream()));
                StringBuilder stringBuilder = new StringBuilder();
                while ((line = reader.readLine()) != null) {
                    stringBuilder.append(line);
                }
                reader.close();

                // Add some fake delay...
                while (this.progress < MAX_PROGRESS) {
                    this.progress++;

                    Thread.sleep(1000);
                    this.updateNotificationInProgress();
                }

                int status = connection.getResponseCode();
                String data = stringBuilder.toString();
                JSONObject response = new JSONObject();

                response.put("status", status);
                response.put("data", data);

                WebServicesWorker.storeRequest(this.getApplicationContext(), id, url, response);
                WebServicesWorker.notifyResolvedResponse(id, response);
                this.updateNotificationCompleted();
            } finally {
                connection.disconnect();
            }
        } catch (Throwable e) {
            System.out.println("WEB_SERVICES_WORKER: error processing request " + e.getMessage());
        }

        return Result.success();
    }

    private int generateNotificationId(Context context) {
        SharedPreferences preferences = context.getSharedPreferences(PREFERENCES_KEY, Context.MODE_PRIVATE);
        int notificationId = preferences.getInt(PREFERENCES_MAX_NOTIFICATION_ID_KEY, 0) + 1;

        preferences.edit().putInt(PREFERENCES_MAX_NOTIFICATION_ID_KEY, notificationId).apply();

        return notificationId;
    }

    private void updateNotificationInProgress() {
        Notification notification = this.getNotificationBuilder()
                .setContentTitle("Processing " + this.notificationTitle + "...")
                .setProgress(MAX_PROGRESS, this.progress, false)
                .setOngoing(true)
                .build();

        setForegroundAsync(new ForegroundInfo(notificationId, notification));
    }

    private void updateNotificationCompleted() {
        Notification notification = this.getNotificationBuilder()
                .setSmallIcon(R.mipmap.smallicon)
                .setContentTitle(this.notificationTitle + " Done!")
                .build();

        setForegroundAsync(new ForegroundInfo(notificationId, notification));
    }

    private NotificationCompat.Builder getNotificationBuilder() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            int importance = NotificationManager.IMPORTANCE_DEFAULT;
            NotificationChannel channel = new NotificationChannel(NOTIFICATIONS_CHANNEL, "WebServicesNotifications", importance);
            channel.setDescription("Notifications about Web Service requests processed for the Moodle App");

            NotificationManagerCompat notificationManager = NotificationManagerCompat.from(this.getApplicationContext());
            notificationManager.createNotificationChannel(channel);
        }

        return new NotificationCompat.Builder(this.getApplicationContext(), NOTIFICATIONS_CHANNEL)
                .setSmallIcon(R.mipmap.smallicon)
                .setPriority(NotificationCompat.PRIORITY_DEFAULT);
    }

}
