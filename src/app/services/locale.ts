export const SUPPORTED_LANGUAGES = ['en', 'da', 'de', 'tr', 'es', 'sv', 'nb', 'fr', 'it', 'nl', 'pl', 'pt-BR'] as const;

/** Browser preference order also reflects the language settings in mobile WebViews. */
export function resolveLanguage(languages: readonly string[]): string {
  for (const language of languages) {
    const base = language.toLowerCase().replace(/_/g, '-').split('-')[0];
    if (base === 'no' || base === 'nb') return 'nb';
    if (base === 'pt') return 'pt-BR';
    if ((SUPPORTED_LANGUAGES as readonly string[]).includes(base)) return base;
  }
  return 'en';
}
