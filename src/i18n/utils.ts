import { DEFAULT_LOCALE, LOCALES, ROUTE_MAP, type Locale } from './config';
import { ui, type UIKey } from './ui';

/**
 * Determines the active locale from a URL pathname.
 * Default is 'es-MX' (at root `/`), English is under `/en`.
 */
export function getLocaleFromUrl(url: URL | string): Locale {
  const pathname = typeof url === 'string' ? url : url.pathname;
  const segments = pathname.split('/').filter(Boolean);

  if (segments.length > 0 && segments[0].toLowerCase() === 'en') {
    return 'en';
  }

  return DEFAULT_LOCALE;
}

/**
 * Returns a typed translation lookup function for the given locale.
 */
export function useTranslations(locale: Locale) {
  return function t(key: UIKey): string {
    const localeDict = ui[locale];
    if (localeDict && key in localeDict) {
      return localeDict[key];
    }
    // Fallback to default locale
    return ui[DEFAULT_LOCALE][key] ?? key;
  };
}

/**
 * Returns the HTML lang tag for the given locale (e.g. 'es-MX' or 'en').
 */
export function getHtmlLang(locale: Locale): string {
  return LOCALES[locale]?.langTag ?? 'es-MX';
}

/**
 * Returns the alternate locale for a binary locale setup.
 */
export function getAlternateLocale(currentLocale: Locale): Locale {
  return currentLocale === 'es-MX' ? 'en' : 'es-MX';
}

/**
 * Normalizes a pathname to remove duplicate or trailing slashes (except root '/').
 */
function normalizePath(path: string): string {
  if (!path || path === '/') return '/';
  const clean = path.replace(/\/+/g, '/').replace(/\/$/, '');
  return clean === '' ? '/' : clean;
}

/**
 * Checks if a path corresponds to a known route key in ROUTE_MAP.
 */
function findRouteKeyByPath(normalizedPath: string): string | undefined {
  for (const [key, mapping] of Object.entries(ROUTE_MAP)) {
    for (const localizedPath of Object.values(mapping)) {
      if (normalizePath(localizedPath) === normalizedPath) {
        return key;
      }
    }
  }
  return undefined;
}

/**
 * Generates the localized pathname for a given target locale.
 * Respects mapped routes and avoids duplicate prefixing.
 */
export function getLocalizedPath(pathname: string, targetLocale: Locale): string {
  const cleanPath = normalizePath(pathname);

  // Check if this path exists in the route map
  const routeKey = findRouteKeyByPath(cleanPath);
  if (routeKey && ROUTE_MAP[routeKey]?.[targetLocale]) {
    return ROUTE_MAP[routeKey][targetLocale];
  }

  // Generic path transformation
  const currentLocale = getLocaleFromUrl(cleanPath);
  if (currentLocale === targetLocale) {
    return cleanPath;
  }

  // Switching from English to Spanish (remove /en prefix)
  if (currentLocale === 'en' && targetLocale === 'es-MX') {
    const stripped = cleanPath.replace(/^\/en(\/|$)/, '/');
    return normalizePath(stripped);
  }

  // Switching from Spanish to English (add /en prefix)
  if (currentLocale === 'es-MX' && targetLocale === 'en') {
    return cleanPath === '/' ? '/en/' : `/en${cleanPath}/`;
  }

  return cleanPath;
}

export interface AlternateUrl {
  hrefLang: string;
  href: string;
}

export interface LocaleUrlsResult {
  canonicalUrl: string;
  alternateUrls: AlternateUrl[];
}

/**
 * Generates canonical and alternate (hreflang) URLs for the current page.
 */
export function getAlternateUrls(currentUrl: URL, siteBaseUrl: string): LocaleUrlsResult {
  const base = siteBaseUrl.replace(/\/$/, '');
  const pathname = currentUrl.pathname;
  const currentLocale = getLocaleFromUrl(currentUrl);

  const esPath = getLocalizedPath(pathname, 'es-MX');
  const enPath = getLocalizedPath(pathname, 'en');

  const esAbsolute = `${base}${esPath.endsWith('/') ? esPath : esPath + '/'}`;
  const enAbsolute = `${base}${enPath.endsWith('/') ? enPath : enPath + '/'}`;

  const canonicalUrl = currentLocale === 'en' ? enAbsolute : esAbsolute;

  const alternateUrls: AlternateUrl[] = [
    { hrefLang: 'es-MX', href: esAbsolute },
    { hrefLang: 'es', href: esAbsolute },
    { hrefLang: 'en', href: enAbsolute },
    { hrefLang: 'x-default', href: esAbsolute },
  ];

  return {
    canonicalUrl,
    alternateUrls,
  };
}
