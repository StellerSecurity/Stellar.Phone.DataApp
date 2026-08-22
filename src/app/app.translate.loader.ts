import { TranslateLoader } from '@ngx-translate/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { TranslationService } from './services/translation.service';
export class TranslateHttpLoader implements TranslateLoader {
  constructor(
    private http: HttpClient,
    private translationService: TranslationService
  ) {}
  getTranslation(lang: string): Observable<any> {
    return this.http.get(`/assets/i18n/${lang}.json`).pipe(
      map((response: any) => {
        this.translationService.allTranslations = response;
        return response;
      }),
      catchError(() =>
        this.http.get(`/assets/i18n/en.json`).pipe(
          map((response: any) => {
            this.translationService.allTranslations = response;
            return response;
          }),
          catchError(() => of({}))
        )
      )
    );
  }
}
