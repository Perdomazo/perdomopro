import { DEFAULT_LOCALE, SUPPORTED_LOCALES, type Locale } from '../i18n/config';

export interface SiteSocialLinks {
  readonly email: string;
  readonly github: string;
  readonly linkedin: string;
}

export interface SiteLocation {
  readonly city: string;
  readonly state: string;
  readonly country: string;
  readonly formatted: string;
}

export interface SiteAuthor {
  readonly name: string;
  readonly brand: string;
  readonly location: SiteLocation;
  readonly title: string;
  readonly education: string;
  readonly focusAreas: readonly string[];
}

export interface SiteConfig {
  readonly name: string;
  readonly brand: string;
  readonly url: string;
  readonly defaultLocale: Locale;
  readonly supportedLocales: readonly Locale[];
  readonly author: SiteAuthor;
  readonly links: SiteSocialLinks;
  readonly themeColor: string;
}

export const siteConfig: SiteConfig = {
  name: 'Adrián Perdomo',
  brand: 'PerdomoPro',
  url: 'https://perdomopro.com',
  defaultLocale: DEFAULT_LOCALE,
  supportedLocales: SUPPORTED_LOCALES,
  themeColor: '#FAFAF8',
  author: {
    name: 'Adrián Perdomo',
    brand: 'PerdomoPro',
    location: {
      city: 'Guadalajara',
      state: 'Jalisco',
      country: 'México',
      formatted: 'Guadalajara, Jalisco, México',
    },
    title: 'Software • Infraestructura • Cloud • Automatización • AI',
    education: 'Ingeniería en Computación',
    focusAreas: [
      'Software Engineering',
      'Cloud Architecture & Services (Azure, AWS)',
      'Infrastructure & Systems Engineering',
      'Networking & Servers',
      'Automation & CI/CD',
      'Artificial Intelligence & Integrations',
      'Distributed Systems',
    ],
  },
  links: {
    email: 'contacto@perdomopro.com',
    github: 'https://github.com/adrianperdomo',
    linkedin: 'https://linkedin.com/in/adrianperdomo',
  },
} as const;
