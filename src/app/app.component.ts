import { Component } from '@angular/core';
import {TranslateService} from "@ngx-translate/core";
import {BackgroundFetch} from '@transistorsoft/capacitor-background-fetch';
import {LocalNotifications} from "@capacitor/local-notifications";
import {Platform} from "@ionic/angular";
@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
})
export class AppComponent {

  public supportedLanguages = ['en', 'da', 'se', 'es', 'fr', 'de'];


  constructor(public _translate: TranslateService, public _platform: Platform) {

    if(this._platform.is('android')) {
      this.initBackgroundFetch();
    }

    this._translate.setDefaultLang('en');

    let userLanguage = <string>this._translate.getBrowserLang();

    if(userLanguage != undefined) {
      if(this.supportedLanguages.includes(userLanguage)) {
        this._translate.use(userLanguage);
      }
    }

  }

  async initBackgroundFetch() {
    const status = await BackgroundFetch.configure({
      minimumFetchInterval: 2880,
      stopOnTerminate: false,
      startOnBoot: true,
      enableHeadless: true
    }, async (taskId) => {
      console.log('[BackgroundFetch] EVENT:', taskId);
      // Perform your work in an awaited Promise
      const result = await this.performYourWorkHere();
      console.log('[BackgroundFetch] work complete:', result);

      BackgroundFetch.finish(taskId);
    }, async (taskId) => {
      // The OS has signalled that your remaining background-time has expired.
      // You must immediately complete your work and signal #finish.
      console.log('[BackgroundFetch] TIMEOUT:', taskId);
      // [REQUIRED] Signal to the OS that your work is complete.
      await BackgroundFetch.finish(taskId);
    });

    // Checking BackgroundFetch status:
    if (status !== BackgroundFetch.STATUS_AVAILABLE) {
      // Uh-oh:  we have a problem:
      if (status === BackgroundFetch.STATUS_DENIED) {
        alert('The user explicitly disabled background behavior for this app or for the whole system.');
      } else if (status === BackgroundFetch.STATUS_RESTRICTED) {
        alert('Background updates are unavailable and the user cannot enable them again.')
      }
    }
  }

  async performYourWorkHere() {
    return new Promise((resolve, reject) => {
      setTimeout(async () => {
        resolve(true);
      }, 5000);
    });
  }

}
