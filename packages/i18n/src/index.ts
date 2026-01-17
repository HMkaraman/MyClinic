/**
 * MyClinic Internationalization
 *
 * Supported Languages:
 * - ar: العربية (Arabic) - RTL
 * - en: English - LTR
 * - ckb: کوردی سۆرانی (Kurdish Sorani) - RTL
 * - kmr: Kurmancî (Kurdish Badini/Kurmanji) - LTR
 */

export type SupportedLocale = 'ar' | 'en' | 'ckb' | 'kmr';

export const DEFAULT_LOCALE: SupportedLocale = 'ar';

export const SUPPORTED_LOCALES: SupportedLocale[] = ['ar', 'en', 'ckb', 'kmr'];

export const RTL_LOCALES: SupportedLocale[] = ['ar', 'ckb'];

export const LOCALE_NAMES: Record<SupportedLocale, string> = {
  ar: 'العربية',
  en: 'English',
  ckb: 'کوردی سۆرانی',
  kmr: 'Kurmancî',
};

export const LOCALE_NATIVE_NAMES: Record<SupportedLocale, string> = {
  ar: 'العربية',
  en: 'English',
  ckb: 'کوردی',
  kmr: 'Kurdî',
};

export function isRTL(locale: SupportedLocale): boolean {
  return RTL_LOCALES.includes(locale);
}

export function getDirection(locale: SupportedLocale): 'rtl' | 'ltr' {
  return isRTL(locale) ? 'rtl' : 'ltr';
}

export function getLocaleInfo(locale: SupportedLocale) {
  return {
    code: locale,
    name: LOCALE_NAMES[locale],
    nativeName: LOCALE_NATIVE_NAMES[locale],
    direction: getDirection(locale),
    isRTL: isRTL(locale),
  };
}

export function getAllLocalesInfo() {
  return SUPPORTED_LOCALES.map(getLocaleInfo);
}
