import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';

import { isRTL, SUPPORTED_LOCALES, type SupportedLocale } from '@myclinic/i18n';
import { QueryProvider } from '@/providers/query-provider';

export function generateStaticParams() {
  return SUPPORTED_LOCALES.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  // Validate locale
  if (!SUPPORTED_LOCALES.includes(locale as SupportedLocale)) {
    notFound();
  }

  const messages = await getMessages();
  const direction = isRTL(locale as SupportedLocale) ? 'rtl' : 'ltr';

  return (
    <div lang={locale} dir={direction}>
      <QueryProvider>
        <NextIntlClientProvider messages={messages}>
          {children}
        </NextIntlClientProvider>
      </QueryProvider>
    </div>
  );
}
