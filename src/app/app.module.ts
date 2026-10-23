import { APP_INITIALIZER, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouteReuseStrategy } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

import { IonicModule, IonicRouteStrategy } from '@ionic/angular';
import { resolveLanguage } from './services/locale';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { APP_TRANSLATIONS } from './app-translations';

export function initTranslations(translate: TranslateService): () => Promise<void> {
  return async () => {
    Object.keys(APP_TRANSLATIONS).forEach((language) => {
      translate.setTranslation(language, APP_TRANSLATIONS[language], true);
    });

    translate.setDefaultLang('en');

    const resolvedLanguage = resolveLanguage(navigator.languages?.length ? navigator.languages : [navigator.language]);
    document.documentElement.lang = resolvedLanguage;

    await firstValueFrom(translate.use(resolvedLanguage));
  };
}

@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserModule,
    HttpClientModule,
    IonicModule.forRoot(),
    AppRoutingModule,
    TranslateModule.forRoot(),
  ],
  providers: [
    {
      provide: APP_INITIALIZER,
      useFactory: initTranslations,
      deps: [TranslateService],
      multi: true,
    },
    {
      provide: RouteReuseStrategy,
      useClass: IonicRouteStrategy,
    },
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
