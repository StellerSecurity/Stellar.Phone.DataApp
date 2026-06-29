import { Component } from '@angular/core';
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
  constructor(public _platform: Platform) {
    this.initializeApp();
  }

  private initializeApp(): void {
    this._platform.ready().then(() => {
      if (this._platform.is('android')) {
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
