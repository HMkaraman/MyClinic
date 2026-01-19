'use client';

import * as React from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  ArrowLeft,
  MessageSquare,
  CreditCard,
  Bell,
  CheckCircle,
  XCircle,
  ChevronRight,
  Settings,
  Activity,
} from 'lucide-react';

interface IntegrationCard {
  id: string;
  type: 'SMS' | 'WHATSAPP' | 'PAYMENT';
  title: string;
  description: string;
  provider?: string;
  isEnabled: boolean;
  isConfigured: boolean;
  href: string;
  icon: React.ReactNode;
}

// Mock data
const mockIntegrations: IntegrationCard[] = [
  {
    id: '1',
    type: 'SMS',
    title: 'SMS Messaging',
    description: 'Send appointment reminders and notifications via SMS',
    provider: 'Twilio',
    isEnabled: true,
    isConfigured: true,
    href: '/settings/integrations/sms',
    icon: <MessageSquare className="h-6 w-6" />,
  },
  {
    id: '2',
    type: 'WHATSAPP',
    title: 'WhatsApp Business',
    description: 'Communicate with patients through WhatsApp',
    provider: undefined,
    isEnabled: false,
    isConfigured: false,
    href: '/settings/integrations/whatsapp',
    icon: <MessageSquare className="h-6 w-6" />,
  },
  {
    id: '3',
    type: 'PAYMENT',
    title: 'Payment Gateway',
    description: 'Accept online payments from patients',
    provider: 'Stripe',
    isEnabled: true,
    isConfigured: true,
    href: '/settings/integrations/payments',
    icon: <CreditCard className="h-6 w-6" />,
  },
];

const mockStats = {
  totalMessages: 1250,
  successRate: 98.5,
  totalPayments: 85000,
  pendingReminders: 12,
};

const mockRecentLogs = [
  { id: '1', action: 'SMS Sent', status: 'SUCCESS', time: '2 min ago' },
  { id: '2', action: 'Payment Processed', status: 'SUCCESS', time: '15 min ago' },
  { id: '3', action: 'SMS Sent', status: 'FAILED', time: '1 hour ago' },
  { id: '4', action: 'WhatsApp Message', status: 'SUCCESS', time: '2 hours ago' },
];

export default function IntegrationsPage() {
  const t = useTranslations();
  const [integrations, setIntegrations] = React.useState(mockIntegrations);

  const handleToggle = (id: string) => {
    setIntegrations(
      integrations.map((integration) =>
        integration.id === id
          ? { ...integration, isEnabled: !integration.isEnabled }
          : integration
      )
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/settings">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {t('integrations.title') || 'Integrations'}
            </h1>
            <p className="text-muted-foreground">
              {t('integrations.description') || 'Configure third-party services and integrations'}
            </p>
          </div>
        </div>
        <Button variant="outline" asChild>
          <Link href="/settings/integrations/logs">
            <Activity className="me-2 h-4 w-4" />
            {t('integrations.viewLogs') || 'View Logs'}
          </Link>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="rounded-full bg-primary/10 p-3">
                <MessageSquare className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('integrations.totalMessages') || 'Total Messages'}</p>
                <p className="text-2xl font-bold">{mockStats.totalMessages.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="rounded-full bg-success/10 p-3">
                <CheckCircle className="h-6 w-6 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('integrations.successRate') || 'Success Rate'}</p>
                <p className="text-2xl font-bold">{mockStats.successRate}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="rounded-full bg-info/10 p-3">
                <CreditCard className="h-6 w-6 text-info" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('integrations.totalPayments') || 'Total Payments'}</p>
                <p className="text-2xl font-bold">${mockStats.totalPayments.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="rounded-full bg-warning/10 p-3">
                <Bell className="h-6 w-6 text-warning" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('integrations.pendingReminders') || 'Pending Reminders'}</p>
                <p className="text-2xl font-bold">{mockStats.pendingReminders}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Integration Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {integrations.map((integration) => (
          <Card key={integration.id} className="relative">
            <CardHeader className="flex flex-row items-start justify-between space-y-0">
              <div className="flex items-start gap-4">
                <div className={`rounded-full p-3 ${
                  integration.isEnabled ? 'bg-primary/10' : 'bg-muted'
                }`}>
                  {integration.icon}
                </div>
                <div className="space-y-1">
                  <CardTitle className="text-lg">{integration.title}</CardTitle>
                  <CardDescription>{integration.description}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {integration.isConfigured ? (
                      <Badge variant="success" className="flex items-center gap-1">
                        <CheckCircle className="h-3 w-3" />
                        {t('integrations.configured') || 'Configured'}
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="flex items-center gap-1">
                        <XCircle className="h-3 w-3" />
                        {t('integrations.notConfigured') || 'Not Configured'}
                      </Badge>
                    )}
                    {integration.provider && (
                      <span className="text-sm text-muted-foreground">
                        via {integration.provider}
                      </span>
                    )}
                  </div>
                  <Switch
                    checked={integration.isEnabled}
                    onCheckedChange={() => handleToggle(integration.id)}
                    disabled={!integration.isConfigured}
                  />
                </div>
                <Button variant="outline" className="w-full" asChild>
                  <Link href={integration.href}>
                    <Settings className="me-2 h-4 w-4" />
                    {t('integrations.configure') || 'Configure'}
                    <ChevronRight className="ms-auto h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Reminder Settings Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            {t('integrations.reminderSettings') || 'Appointment Reminders'}
          </CardTitle>
          <CardDescription>
            {t('integrations.reminderSettingsDescription') ||
              'Configure automated appointment reminders'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">{t('integrations.autoReminders') || 'Automatic Reminders'}</p>
              <p className="text-sm text-muted-foreground">
                {t('integrations.autoRemindersDescription') ||
                  'Send reminders 24 hours and 1 hour before appointments'}
              </p>
            </div>
            <Button variant="outline" asChild>
              <Link href="/settings/integrations/reminders">
                <Settings className="me-2 h-4 w-4" />
                {t('common.settings') || 'Settings'}
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            {t('integrations.recentActivity') || 'Recent Activity'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {mockRecentLogs.map((log) => (
              <div key={log.id} className="flex items-center justify-between py-2 border-b last:border-0">
                <div className="flex items-center gap-3">
                  {log.status === 'SUCCESS' ? (
                    <CheckCircle className="h-4 w-4 text-success" />
                  ) : (
                    <XCircle className="h-4 w-4 text-destructive" />
                  )}
                  <span>{log.action}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant={log.status === 'SUCCESS' ? 'success' : 'destructive'}>
                    {log.status}
                  </Badge>
                  <span className="text-sm text-muted-foreground">{log.time}</span>
                </div>
              </div>
            ))}
          </div>
          <Button variant="link" className="mt-4 px-0" asChild>
            <Link href="/settings/integrations/logs">
              {t('integrations.viewAllLogs') || 'View all activity logs'} →
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
