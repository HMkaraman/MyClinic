'use client';

import * as React from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  User,
  Shield,
  Bell,
  Globe,
  Building,
  Users,
  Stethoscope,
  Receipt,
  ArrowRight,
} from 'lucide-react';

const settingsGroups = [
  {
    title: 'settings.personal',
    items: [
      {
        title: 'settings.profile',
        description: 'settings.profileDescription',
        href: '/settings/profile',
        icon: User,
      },
      {
        title: 'settings.security',
        description: 'settings.securityDescription',
        href: '/settings/security',
        icon: Shield,
      },
      {
        title: 'settings.notifications',
        description: 'settings.notificationsDescription',
        href: '/settings/notifications',
        icon: Bell,
      },
      {
        title: 'settings.language',
        description: 'settings.languageDescription',
        href: '/settings/language',
        icon: Globe,
      },
    ],
  },
  {
    title: 'settings.clinic',
    items: [
      {
        title: 'settings.clinicInfo',
        description: 'settings.clinicInfoDescription',
        href: '/settings/clinic',
        icon: Building,
        adminOnly: true,
      },
      {
        title: 'settings.staff',
        description: 'settings.staffDescription',
        href: '/settings/staff',
        icon: Users,
        adminOnly: true,
      },
      {
        title: 'settings.services',
        description: 'settings.servicesDescription',
        href: '/settings/services',
        icon: Stethoscope,
        adminOnly: true,
      },
      {
        title: 'settings.billing',
        description: 'settings.billingDescription',
        href: '/settings/billing',
        icon: Receipt,
        adminOnly: true,
      },
    ],
  },
];

export default function SettingsPage() {
  const t = useTranslations();

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
