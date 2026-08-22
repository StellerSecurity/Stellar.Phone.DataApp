import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { EnvironmentProviders, Provider } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideIonicAngular } from '@ionic/angular';
import { provideTranslateService } from '@ngx-translate/core';

const testProviders: Array<Provider | EnvironmentProviders> = [
  provideIonicAngular(),
  provideRouter([]),
  provideHttpClient(),
  provideHttpClientTesting(),
  provideTranslateService({ fallbackLang: 'en', lang: 'en' }),
];

export default testProviders;
