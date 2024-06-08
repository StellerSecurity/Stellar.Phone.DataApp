package stellar.phone.dataApp;

/// ---------------- Paste everything BELOW THIS LINE: -----------------------

import static androidx.core.content.ContextCompat.getSystemService;
import static com.getcapacitor.util.JSONUtils.getString;

import android.app.Activity;
import android.app.NotificationManager;
import android.content.Context;
import android.content.SharedPreferences;
import android.util.Log;

import com.transistorsoft.tsbackgroundfetch.BackgroundFetch;
import com.transistorsoft.tsbackgroundfetch.BGTask;

import org.json.JSONException;
import org.json.JSONObject;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.MalformedURLException;
import java.net.URL;

public class BackgroundFetchHeadlessTask{
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


    Log.d("DATAPP", sim_id + " hehe");

    if(sim_id != null) {

      Thread httpThread = new Thread() {
          public void run() {
            try {

              Log.d("DATAPP", "starting...");
              URL url = new URL("https://stellardatauiapiappprod.azurewebsites.net/api/v1/overviewcontroller/view?id=" + sim_id);
              HttpURLConnection conn = (HttpURLConnection) url.openConnection();
              Log.d("DATAPP", "starting1...");
              conn.setRequestMethod("GET");
              Log.d("DATAPP", "starting2...");
              conn.connect();
              int responsecode = conn.getResponseCode();

              JSONObject jObject = new JSONObject(readFullyAsString(conn.getInputStream(), "UTF-8"));
              int days_left = jObject.optInt("days_until_expire", 0);


              if(14 > days_left) {
                // send notification..
              }

              //Log.d("DATAPP", "pedh" + days_left);
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
