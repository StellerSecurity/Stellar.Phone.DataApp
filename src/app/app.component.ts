import { Component } from '@angular/core';
import {TranslateService} from "@ngx-translate/core";

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
})
export class AppComponent {

  public supportedLanguages = ['en', 'da', 'se', 'es', 'fr', 'de'];

  constructor(public _translate: TranslateService) {

    this._translate.setDefaultLang('en');

    let userLanguage = <string>this._translate.getBrowserLang();

    if(userLanguage != undefined) {
      if(this.supportedLanguages.includes(userLanguage)) {
        this._translate.use(userLanguage);
      }
    }

  }
}
