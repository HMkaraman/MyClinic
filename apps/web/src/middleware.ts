import createMiddleware from 'next-intl/middleware';

import { DEFAULT_LOCALE, SUPPORTED_LOCALES } from '@myclinic/i18n';

export default createMiddleware({
  // A list of all locales that are supported
  locales: SUPPORTED_LOCALES,

  // Used when no locale matches
  defaultLocale: DEFAULT_LOCALE,

  // Locale prefix strategy
  localePrefix: 'as-needed',
});

export const config = {
  // Match all routes except static files and API routes
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|icons|manifest.json|sw.js|.*\\..*).*)',
  ],
};
