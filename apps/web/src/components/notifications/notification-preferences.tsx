'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { Loader2 } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useNotificationStore, type NotificationPreferences } from '@/stores/notification-store';

const preferenceGroups = [
  {
    title: 'appointments',
    description: 'appointmentsDescription',
    preferences: [
      { key: 'appointmentCreated', label: 'appointmentCreated' },
      { key: 'appointmentCancelled', label: 'appointmentCancelled' },
      { key: 'appointmentRescheduled', label: 'appointmentRescheduled' },
    ],
  },
  {
    title: 'tasks',
    description: 'tasksDescription',
    preferences: [
      { key: 'taskAssigned', label: 'taskAssigned' },
      { key: 'taskCompleted', label: 'taskCompleted' },
    ],
  },
  {
    title: 'crm',
    description: 'crmDescription',
    preferences: [
      { key: 'leadStageChanged', label: 'leadStageChanged' },
      { key: 'messageReceived', label: 'messageReceived' },
    ],
  },
  {
    title: 'billing',
    description: 'billingDescription',
    preferences: [
      { key: 'invoicePaid', label: 'invoicePaid' },
      { key: 'invoiceOverdue', label: 'invoiceOverdue' },
    ],
  },
  {
    title: 'system',
    description: 'systemDescription',
    preferences: [
      { key: 'systemNotifications', label: 'systemNotifications' },
    ],
  },
] as const;

export function NotificationPreferencesForm() {
  const t = useTranslations('notifications.preferences');
  const { preferences, fetchPreferences, updatePreferences } = useNotificationStore();
  const [localPreferences, setLocalPreferences] = React.useState<NotificationPreferences | null>(null);
  const [isSaving, setIsSaving] = React.useState(false);
  const [hasChanges, setHasChanges] = React.useState(false);

  React.useEffect(() => {
    fetchPreferences();
  }, [fetchPreferences]);

  React.useEffect(() => {
    if (preferences) {
      setLocalPreferences(preferences);
    }
  }, [preferences]);

  const handleToggle = (key: keyof NotificationPreferences) => {
    if (!localPreferences) return;

    const newPreferences = {
      ...localPreferences,
      [key]: !localPreferences[key],
    };
    setLocalPreferences(newPreferences);
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (!localPreferences || !hasChanges) return;

    setIsSaving(true);
    try {
      await updatePreferences(localPreferences);
      setHasChanges(false);
    } catch {
      // Error handled in store
    } finally {
      setIsSaving(false);
    }
  };

  if (!localPreferences) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {preferenceGroups.map((group) => (
        <Card key={group.title}>
          <CardHeader>
            <CardTitle className="text-lg">{t(group.title)}</CardTitle>
            <CardDescription>{t(group.description)}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {group.preferences.map((pref) => (
              <div
                key={pref.key}
                className="flex items-center justify-between"
              >
                <Label
                  htmlFor={pref.key}
                  className="flex-1 cursor-pointer"
                >
                  {t(pref.label)}
                </Label>
                <Switch
                  id={pref.key}
                  checked={localPreferences[pref.key as keyof NotificationPreferences] ?? true}
                  onCheckedChange={() => handleToggle(pref.key as keyof NotificationPreferences)}
                />
              </div>
            ))}
          </CardContent>
        </Card>
      ))}

      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={!hasChanges || isSaving}
        >
          {isSaving && <Loader2 className="h-4 w-4 me-2 animate-spin" />}
          {t('save')}
        </Button>
      </div>
    </div>
  );
}
