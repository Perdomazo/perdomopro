/**
 * Internationalization (i18n) Configuration
 *
 * Defines supported locales, default locale, language codes,
 * and routing paths for the PerdomoPro platform.
 *
 * Primary language: Spanish (es-MX) -> root `/`
 * Secondary language: English (en) -> `/en/`
 */

export const DEFAULT_LOCALE = 'es-MX' as const;

export const SUPPORTED_LOCALES = ['es-MX', 'en'] as const;

export type Locale = (typeof SUPPORTED_LOCALES)[number];

export interface LocaleDefinition {
  readonly code: Locale;
  readonly langTag: string; // ISO language tag for <html lang="...">
  readonly hrefLang: string; // ISO code for alternate hreflang tags
  readonly ogLocale: string; // OpenGraph locale format e.g. es_MX, en_US
  readonly name: string; // Native language name
  readonly label: string; // Short UI abbreviation
  readonly pathPrefix: string; // Prefix in URLs (empty string for default)
  readonly dir: 'ltr' | 'rtl';
}

export const LOCALES: Record<Locale, LocaleDefinition> = {
  'es-MX': {
    code: 'es-MX',
    langTag: 'es-MX',
    hrefLang: 'es-MX',
    ogLocale: 'es_MX',
    name: 'Español (México)',
    label: 'ES',
    pathPrefix: '',
    dir: 'ltr',
  },
  en: {
    code: 'en',
    langTag: 'en',
    hrefLang: 'en',
    ogLocale: 'en_US',
    name: 'English',
    label: 'EN',
    pathPrefix: '/en',
    dir: 'ltr',
  },
} as const;

/**
 * Route mapping table for localized paths.
 * Allows translating URLs between locales (e.g. /proyectos <-> /en/projects)
 * without hardcoding in templates.
 */
export const ROUTE_MAP: Record<string, Record<Locale, string>> = {
  home: {
    'es-MX': '/',
    en: '/en/',
  },
  projects: {
    'es-MX': '/proyectos/',
    en: '/en/projects/',
  },
  consulting: {
    'es-MX': '/consultoria/',
    en: '/en/consulting/',
  },
  blog: {
    'es-MX': '/blog/',
    en: '/en/blog/',
  },
} as const;
