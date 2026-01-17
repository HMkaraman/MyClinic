import { getRequestConfig } from 'next-intl/server';
import type { AbstractIntlMessages } from 'next-intl';

import { DEFAULT_LOCALE, SUPPORTED_LOCALES, type SupportedLocale } from '@myclinic/i18n';

const localeMessages: Record<SupportedLocale, () => Promise<{ default: AbstractIntlMessages }>> = {
  ar: () => import('@myclinic/i18n/locales/ar') as Promise<{ default: AbstractIntlMessages }>,
  en: () => import('@myclinic/i18n/locales/en') as Promise<{ default: AbstractIntlMessages }>,
  ckb: () => import('@myclinic/i18n/locales/ckb') as Promise<{ default: AbstractIntlMessages }>,
  kmr: () => import('@myclinic/i18n/locales/kmr') as Promise<{ default: AbstractIntlMessages }>,
};

export default getRequestConfig(async ({ requestLocale }) => {
  const locale = await requestLocale;

  // Validate that the locale is supported
  const validLocale = locale && SUPPORTED_LOCALES.includes(locale as SupportedLocale)
    ? (locale as SupportedLocale)
    : DEFAULT_LOCALE;

  return {
    locale: validLocale,
    messages: (await localeMessages[validLocale]()).default,
  };
});
