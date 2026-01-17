'use client';

import { useTranslations } from 'next-intl';
import Link from 'next/link';

import { SUPPORTED_LOCALES, LOCALE_NAMES, type SupportedLocale } from '@myclinic/i18n';

export default function HomePage() {
  const t = useTranslations();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between text-center">
        {/* Logo/Title */}
        <h1 className="text-4xl font-bold mb-4">
          {t('common.appName')}
        </h1>

        <p className="text-xl text-muted-foreground mb-8">
          نظام متكامل لإدارة العيادات الطبية مع الذكاء الاصطناعي
        </p>

        {/* Status Badge */}
        <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-primary mb-8">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
          </span>
          <span className="text-sm font-medium">Milestone 0 - تهيئة المشروع</span>
        </div>

        {/* Quick Actions */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-12">
          <div className="rounded-lg border bg-card p-6 text-card-foreground shadow-sm">
            <h3 className="font-semibold">المرضى</h3>
            <p className="text-sm text-muted-foreground">إدارة ملفات المرضى</p>
          </div>
          <div className="rounded-lg border bg-card p-6 text-card-foreground shadow-sm">
            <h3 className="font-semibold">المواعيد</h3>
            <p className="text-sm text-muted-foreground">جدولة المواعيد</p>
          </div>
          <div className="rounded-lg border bg-card p-6 text-card-foreground shadow-sm">
            <h3 className="font-semibold">الفواتير</h3>
            <p className="text-sm text-muted-foreground">إصدار الفواتير</p>
          </div>
          <div className="rounded-lg border bg-card p-6 text-card-foreground shadow-sm">
            <h3 className="font-semibold">صندوق الوارد</h3>
            <p className="text-sm text-muted-foreground">إدارة المحادثات</p>
          </div>
        </div>

        {/* Language Switcher */}
        <div className="flex flex-wrap justify-center gap-2">
          {SUPPORTED_LOCALES.map((loc) => (
            <Link
              key={loc}
              href={`/${loc}`}
              className="inline-flex items-center rounded-md border px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              {LOCALE_NAMES[loc as SupportedLocale]}
            </Link>
          ))}
        </div>

        {/* Tech Stack Info */}
        <div className="mt-12 pt-8 border-t">
          <p className="text-sm text-muted-foreground">
            Built with Next.js • NestJS • PostgreSQL • Prisma • Tailwind CSS
          </p>
        </div>
      </div>
    </main>
  );
}
