package stellar.phone.dataApp;

/// ---------------- Paste everything BELOW THIS LINE: -----------------------

import static com.getcapacitor.util.JSONUtils.getString;

import android.app.Activity;
import android.content.Context;
import android.content.SharedPreferences;
import android.util.Log;


import com.getcapacitor.annotation.CapacitorPlugin;
import com.transistorsoft.tsbackgroundfetch.BackgroundFetch;
import com.transistorsoft.tsbackgroundfetch.BGTask;

import java.util.prefs.Preferences;

public class BackgroundFetchHeadlessTask{
  public void onFetch(Context context,  BGTask task) {
    // Get a reference to the BackgroundFetch Android API.
    BackgroundFetch backgroundFetch = BackgroundFetch.getInstance(context);
    // Get the taskId.
    String taskId = task.getTaskId();
    // Log a message to adb logcat.
    Log.d("MyHeadlessTask", "BackgroundFetchHeadlessTask onFetch -- CUSTOM IMPLEMENTATION: " + taskId);

    boolean isTimeout = task.getTimedOut();

    this.preferences = context.getSharedPreferences(configuration.group, Activity.MODE_PRIVATE);

    String name = prefs.getString("name", null);

    Log.d("PEDH", name + " ha ha");


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
}
