package stellar.phone.dataApp;

import android.os.Bundle;
import android.view.WindowManager;

import androidx.core.view.WindowCompat;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

  @Override
  protected void onCreate(Bundle savedInstanceState) {
    // Leave the splash theme ASAP (otherwise resize is ignored on some OEM devices)
    setTheme(R.style.AppTheme_NoActionBar);

    super.onCreate(savedInstanceState);

    // Critical for Android 11+ / OEM insets issues
    WindowCompat.setDecorFitsSystemWindows(getWindow(), true);

    // Force resize behavior at runtime (some devices ignore manifest-only)
    getWindow().setSoftInputMode(
      WindowManager.LayoutParams.SOFT_INPUT_ADJUST_RESIZE
        | WindowManager.LayoutParams.SOFT_INPUT_STATE_HIDDEN
    );
  }
}
