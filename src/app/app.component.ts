import { Component } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Platform } from '@ionic/angular';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Capacitor } from '@capacitor/core';
import { Keyboard } from '@capacitor/keyboard';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
})
export class AppComponent {
  public supportedLanguages = ['en', 'da', 'se', 'es', 'fr', 'de'];

  constructor(public _translate: TranslateService, public _platform: Platform) {
    this._translate.setDefaultLang('en');

    const userLanguage = this._translate.getBrowserLang() as string;
    if (userLanguage !== undefined && this.supportedLanguages.includes(userLanguage)) {
      this._translate.use(userLanguage);
    }

    // Ensure native plugins run only after platform is ready
    this._platform.ready().then(() => {
      if (this._platform.is('android')) {
        // Avoid overlays that break keyboard resize on some devices
        StatusBar.setOverlaysWebView({ overlay: false }).catch(() => {});
      }

      StatusBar.setBackgroundColor({ color: '#2152D4' }).catch(() => {});
      StatusBar.setStyle({ style: Style.Light }).catch(() => {});

      if (this._platform.is('android')) {
        this.setupAndroidKeyboardPaddingFallback();
      }
    });
  }

  private setupAndroidKeyboardPaddingFallback(): void {
    if (!Capacitor.isNativePlatform()) return;
    if (Capacitor.getPlatform() !== 'android') return;

    const setKeyboardHeight = (h: number) => {
      document.documentElement.style.setProperty('--kb-h', `${h}px`);
      document.body.classList.add('kb-open');
    };

    const clearKeyboardHeight = () => {
      document.documentElement.style.setProperty('--kb-h', '0px');
      document.body.classList.remove('kb-open');
    };

    // Some devices fire will* only, others did* only — listen to both
    Keyboard.addListener('keyboardWillShow', (info) => {
      setKeyboardHeight(info?.keyboardHeight ?? 0);
    });

    Keyboard.addListener('keyboardDidShow', (info) => {
      setKeyboardHeight(info?.keyboardHeight ?? 0);
    });

    Keyboard.addListener('keyboardWillHide', () => {
      clearKeyboardHeight();
    });

    Keyboard.addListener('keyboardDidHide', () => {
      clearKeyboardHeight();
    });
  }
}
