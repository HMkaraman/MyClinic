'use client';

import * as React from 'react';
import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  User,
  Shield,
  Plug,
  Users,
  ArrowRight,
} from 'lucide-react';
import { useAuthStore } from '@/stores/auth-store';

export default function SettingsPage() {
  const t = useTranslations();
  const locale = useLocale();
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'ADMIN';

  const settingsGroups = [
    {
      title: 'settings.personal',
      items: [
        {
          title: 'settings.profile',
          description: 'settings.profileDescription',
          href: `/${locale}/settings/profile`,
          icon: User,
        },
        {
          title: 'settings.security',
          description: 'settings.securityDescription',
          href: `/${locale}/settings/security`,
          icon: Shield,
        },
      ],
    },
    {
      title: 'settings.clinic',
      items: [
        ...(isAdmin
          ? [
              {
                title: 'settings.staff',
                description: 'settings.staffDescription',
                href: `/${locale}/settings/staff`,
                icon: Users,
                adminOnly: true,
              },
            ]
          : []),
        {
          title: 'settings.integrations',
          description: 'settings.integrationsDescription',
          href: `/${locale}/settings/integrations`,
          icon: Plug,
          adminOnly: true,
        },
      ],
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          {t('settings.title')}
        </h1>
        <p className="text-muted-foreground">
          {t('settings.description')}
        </p>
      </div>

      {/* Settings Groups */}
      {settingsGroups.map((group) => (
        <div key={group.title} className="space-y-4">
          <h2 className="text-lg font-semibold">{t(group.title)}</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {group.items.map((item) => (
              <Link key={item.href} href={item.href}>
                <Card className="hover:border-primary transition-colors cursor-pointer h-full">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-muted rounded-lg">
                          <item.icon className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <CardTitle className="text-base">{t(item.title)}</CardTitle>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground rtl:rotate-180" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardDescription>{t(item.description)}</CardDescription>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
