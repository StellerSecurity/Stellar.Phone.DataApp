import { resolveLanguage, SUPPORTED_LANGUAGES } from './locale';
import { APP_TRANSLATIONS } from '../app-translations';

describe('automatic language selection', () => {
  it('uses the first supported language in preference order', () => {
    expect(resolveLanguage(['ja-JP', 'de-CH', 'en-US'])).toBe('de');
    expect(resolveLanguage(['fr-CA', 'da-DK'])).toBe('fr');
  });
  it('normalizes regions, case, Norwegian and Portuguese', () => {
    for (const locale of ['nb', 'nb-NO', 'no', 'no-NO']) expect(resolveLanguage([locale])).toBe('nb');
    for (const locale of ['pt', 'pt-BR', 'pt-PT']) expect(resolveLanguage([locale])).toBe('pt-BR');
    expect(resolveLanguage(['TR_tr'])).toBe('tr');
  });
  it('falls back to English for an empty or unsupported list', () => {
    expect(resolveLanguage([])).toBe('en');
    expect(resolveLanguage(['ja-JP', 'ar'])).toBe('en');
  });
  it('has complete dictionaries with matching interpolation fields for every language', () => {
    const keys = Object.keys(APP_TRANSLATIONS['en']).sort();
    expect(Object.keys(APP_TRANSLATIONS).sort()).toEqual([...SUPPORTED_LANGUAGES].sort());
    for (const lang of SUPPORTED_LANGUAGES) {
      expect(Object.keys(APP_TRANSLATIONS[lang]).sort()).toEqual(keys);
      for (const key of keys) {
        const value = APP_TRANSLATIONS[lang][key];
        expect(value.trim().length).toBeGreaterThan(0);
        expect((value.match(/{{\s*\w+\s*}}/g) || []).sort())
          .toEqual((APP_TRANSLATIONS['en'][key].match(/{{\s*\w+\s*}}/g) || []).sort());
      }
      expect(APP_TRANSLATIONS[lang]['HOME_ENTER_SIM_ID']).toContain('16');
    }
  });
});
