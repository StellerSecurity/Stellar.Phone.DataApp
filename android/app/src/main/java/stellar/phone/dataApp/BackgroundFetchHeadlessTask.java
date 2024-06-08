package stellar.phone.dataApp;

/// ---------------- Paste everything BELOW THIS LINE: -----------------------

import static android.content.Context.NOTIFICATION_SERVICE;
import static androidx.core.content.ContextCompat.getSystemService;
import static com.getcapacitor.util.JSONUtils.getString;

import android.app.Activity;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.graphics.Color;
import android.util.Log;

import androidx.core.app.NotificationCompat;

import com.capacitorjs.plugins.localnotifications.LocalNotification;
import com.capacitorjs.plugins.localnotifications.LocalNotificationAttachment;
import com.getcapacitor.JSObject;
import com.getcapacitor.PluginCall;
import com.transistorsoft.tsbackgroundfetch.BackgroundFetch;
import com.transistorsoft.tsbackgroundfetch.BGTask;

import org.json.JSONException;
import org.json.JSONObject;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.text.ParseException;

public class BackgroundFetchHeadlessTask{

  NotificationManager notificationManager;

  Notification notification = null;

  public void onFetch(Context context,  BGTask task) {
    // Get a reference to the BackgroundFetch Android API.
    BackgroundFetch backgroundFetch = BackgroundFetch.getInstance(context);
    // Get the taskId.
    String taskId = task.getTaskId();
    // Log a message to adb logcat.
    Log.d("MyHeadlessTask", "BackgroundFetchHeadlessTask onFetch -- CUSTOM IMPLEMENTATION: " + taskId);

    boolean isTimeout = task.getTimedOut();

    SharedPreferences sh = context.getSharedPreferences("CapacitorStorage", Activity.MODE_PRIVATE);
    String sim_id = sh.getString("sim_id", null);

    if(sim_id != null) {

      Thread httpThread = new Thread() {
          public void run() {
            try {

              URL url = new URL("https://stellardatauiapiappprod.azurewebsites.net/api/v1/overviewcontroller/view?id=" + sim_id);
              HttpURLConnection conn = (HttpURLConnection) url.openConnection();
              conn.setRequestMethod("GET");
              conn.connect();

              JSONObject jObject = new JSONObject(readFullyAsString(conn.getInputStream(), "UTF-8"));
              int days_left = jObject.optInt("days_until_expire", 0);

              if(14 >= days_left && 0 <= days_left) {

                NotificationCompat.Builder builder =null ;

                NotificationManager notificationManager = (NotificationManager)context.getSystemService(context.NOTIFICATION_SERVICE);

                NotificationChannel notificationChannel = new NotificationChannel(
                  "stellar.phone.dataApp",
                  "Stellar Phone",
                  NotificationManager.IMPORTANCE_DEFAULT);

                notificationManager.createNotificationChannel(notificationChannel);

                Intent intent = new Intent(Intent.ACTION_MAIN);
                intent.addCategory(Intent.CATEGORY_LAUNCHER);
                intent.setClass(context, MainActivity.class);
                intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK|Intent.FLAG_ACTIVITY_RESET_TASK_IF_NEEDED);

                PendingIntent pendingIntent = PendingIntent.getActivity(context, 0, intent, PendingIntent.FLAG_MUTABLE);

                builder = new NotificationCompat.Builder(context, "stellar.phone.dataApp")
                  .setAutoCancel(false)
                  .setOngoing(false)
                  .setContentTitle("Stellar Data")
                  .setContentIntent(pendingIntent)
                  .setSmallIcon(R.drawable.ic_launcher_foreground)
                  .setContentText("Your Stellar Data will expire in " + days_left + " days")
                  .setWhen(System.currentTimeMillis());

                notificationManager.notify(696969, builder.build());

              }

            } catch (IOException exception) {
              //Log.d("DATAPP", exception.getMessage() + " lol");
            } catch (JSONException e) {
              //Log.d("DATAPP", e.getMessage() + " lol2");
            }
          }
      };

      httpThread.start();

    }

    // Is this a timeout?
    if (isTimeout) {
      backgroundFetch.finish(taskId);
      return;
    }
    // Do your work here...
    //
    //
    // Signal finish just like the Javascript API.
    backgroundFetch.finish(taskId);

  }

  public String readFullyAsString(InputStream inputStream, String encoding) throws IOException {
    return readFully(inputStream).toString(encoding);
  }

  private ByteArrayOutputStream readFully(InputStream inputStream) throws IOException {
    ByteArrayOutputStream baos = new ByteArrayOutputStream();
    byte[] buffer = new byte[1024];
    int length = 0;
    while ((length = inputStream.read(buffer)) != -1) {
      baos.write(buffer, 0, length);
    }
    return baos;
  }

}
