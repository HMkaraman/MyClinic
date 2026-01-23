'use client';

import * as React from 'react';
import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  ArrowLeft,
  Key,
  Smartphone,
  Monitor,
  Clock,
  MapPin,
  AlertTriangle,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Error state type
interface PasswordErrors {
  currentPassword?: string;
  newPassword?: string;
  confirmPassword?: string;
}

const mockSessions = [
  {
    id: '1',
    device: 'Chrome on Windows',
    location: 'بغداد، العراق',
    lastActive: '2024-01-18 10:30',
    isCurrent: true,
  },
  {
    id: '2',
    device: 'Safari on iPhone',
    location: 'بغداد، العراق',
    lastActive: '2024-01-17 15:45',
    isCurrent: false,
  },
];

export default function SecuritySettingsPage() {
  const t = useTranslations();
  const locale = useLocale();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = React.useState(false);
  const [is2FAEnabled, setIs2FAEnabled] = React.useState(false);
  const [passwordErrors, setPasswordErrors] = React.useState<PasswordErrors>({});
  const [passwordForm, setPasswordForm] = React.useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // Validate password form and return true if valid
  const validatePasswordForm = (): boolean => {
    const errors: PasswordErrors = {};
    const missingFields: string[] = [];

    if (!passwordForm.currentPassword) {
      errors.currentPassword = 'errors.required';
      missingFields.push(t('settings.currentPassword'));
    }
    if (!passwordForm.newPassword) {
      errors.newPassword = 'errors.required';
      missingFields.push(t('settings.newPassword'));
    }
    if (!passwordForm.confirmPassword) {
      errors.confirmPassword = 'errors.required';
      missingFields.push(t('settings.confirmPassword'));
    }

    // Check password length
    if (passwordForm.newPassword && passwordForm.newPassword.length < 8) {
      errors.newPassword = 'errors.minLength';
    }

    // Check passwords match
    if (passwordForm.newPassword && passwordForm.confirmPassword &&
        passwordForm.newPassword !== passwordForm.confirmPassword) {
      errors.confirmPassword = 'errors.passwordMismatch';
    }

    setPasswordErrors(errors);

    if (Object.keys(errors).length > 0) {
      toast({
        title: t('common.error'),
        description: (
          <div className="space-y-2">
            {missingFields.length > 0 && (
              <div>
                <p className="font-medium">{t('errors.missingRequiredFields')}:</p>
                <ul className="list-disc list-inside ms-2 mt-1">
                  {missingFields.map((field, index) => (
                    <li key={index}>{field}</li>
                  ))}
                </ul>
              </div>
            )}
            {errors.newPassword === 'errors.minLength' && <p>{t('errors.minLength', { min: 8 })}</p>}
            {errors.confirmPassword === 'errors.passwordMismatch' && <p>{t('errors.passwordMismatch')}</p>}
          </div>
        ),
        variant: 'destructive',
      });
      return false;
    }

    return true;
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validatePasswordForm()) {
      return;
    }

    setIsLoading(true);
    // Would send to API
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsLoading(false);
    setPasswordForm({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    });
    setPasswordErrors({});

    toast({
      title: t('common.success'),
      description: t('common.success'),
    });
  };

  const handleToggle2FA = async () => {
    setIsLoading(true);
    // Would send to API
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIs2FAEnabled(!is2FAEnabled);
    setIsLoading(false);
  };

  const handleLogoutSession = async (sessionId: string) => {
    // Would send to API
    console.log('Logout session:', sessionId);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/${locale}/settings`}>
            <ArrowLeft className="h-5 w-5 rtl:rotate-180" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {t('settings.security')}
          </h1>
          <p className="text-muted-foreground">
            {t('settings.securityDescription')}
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Change Password */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-muted rounded-lg">
                <Key className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <CardTitle>{t('settings.changePassword')}</CardTitle>
                <CardDescription>{t('settings.changePasswordDescription')}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">{t('settings.currentPassword')} <span className="text-destructive">*</span></Label>
                <Input
                  id="currentPassword"
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={(e) => {
                    setPasswordForm({ ...passwordForm, currentPassword: e.target.value });
                    if (passwordErrors.currentPassword) setPasswordErrors(prev => ({ ...prev, currentPassword: undefined }));
                  }}
                  error={!!passwordErrors.currentPassword}
                />
                {passwordErrors.currentPassword && <p className="text-sm text-destructive">{t(passwordErrors.currentPassword)}</p>}
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="newPassword">{t('settings.newPassword')} <span className="text-destructive">*</span></Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={passwordForm.newPassword}
                    onChange={(e) => {
                      setPasswordForm({ ...passwordForm, newPassword: e.target.value });
                      if (passwordErrors.newPassword) setPasswordErrors(prev => ({ ...prev, newPassword: undefined }));
                    }}
                    error={!!passwordErrors.newPassword}
                  />
                  {passwordErrors.newPassword && <p className="text-sm text-destructive">{t(passwordErrors.newPassword, { min: 8 })}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">{t('settings.confirmPassword')} <span className="text-destructive">*</span></Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => {
                      setPasswordForm({ ...passwordForm, confirmPassword: e.target.value });
                      if (passwordErrors.confirmPassword) setPasswordErrors(prev => ({ ...prev, confirmPassword: undefined }));
                    }}
                    error={!!passwordErrors.confirmPassword}
                  />
                  {passwordErrors.confirmPassword && <p className="text-sm text-destructive">{t(passwordErrors.confirmPassword)}</p>}
                </div>
              </div>
              <div className="flex justify-end">
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? t('common.saving') : t('settings.updatePassword')}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Two-Factor Authentication */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-muted rounded-lg">
                  <Smartphone className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <CardTitle>{t('settings.twoFactor')}</CardTitle>
                  <CardDescription>{t('settings.twoFactorDescription')}</CardDescription>
                </div>
              </div>
              <Badge variant={is2FAEnabled ? 'success' : 'secondary'}>
                {is2FAEnabled ? t('common.enabled') : t('common.disabled')}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">
                  {is2FAEnabled
                    ? t('settings.twoFactorEnabledMessage')
                    : t('settings.twoFactorDisabledMessage')}
                </p>
              </div>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant={is2FAEnabled ? 'destructive' : 'default'}>
                    {is2FAEnabled ? t('settings.disable2FA') : t('settings.enable2FA')}
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>
                      {is2FAEnabled ? t('settings.disable2FA') : t('settings.enable2FA')}
                    </DialogTitle>
                    <DialogDescription>
                      {is2FAEnabled
                        ? t('settings.disable2FAConfirm')
                        : t('settings.enable2FAInstructions')}
                    </DialogDescription>
                  </DialogHeader>
                  {!is2FAEnabled && (
                    <div className="space-y-4">
                      <div className="flex justify-center p-4 bg-muted rounded-lg">
                        <div className="w-40 h-40 bg-white rounded flex items-center justify-center text-muted-foreground">
                          QR Code
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>{t('settings.verificationCode')}</Label>
                        <Input placeholder="000000" maxLength={6} />
                      </div>
                    </div>
                  )}
                  <DialogFooter>
                    <Button variant="outline">{t('common.cancel')}</Button>
                    <Button
                      variant={is2FAEnabled ? 'destructive' : 'default'}
                      onClick={handleToggle2FA}
                    >
                      {is2FAEnabled ? t('settings.disable') : t('settings.enable')}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>

        {/* Active Sessions */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-muted rounded-lg">
                  <Monitor className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <CardTitle>{t('settings.activeSessions')}</CardTitle>
                  <CardDescription>{t('settings.activeSessionsDescription')}</CardDescription>
                </div>
              </div>
              <Button variant="outline" size="sm">
                {t('settings.logoutAll')}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockSessions.map((session) => (
                <div
                  key={session.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-muted rounded-lg">
                      <Monitor className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{session.device}</p>
                        {session.isCurrent && (
                          <Badge variant="success">{t('settings.currentSession')}</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {session.location}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {session.lastActive}
                        </div>
                      </div>
                    </div>
                  </div>
                  {!session.isCurrent && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleLogoutSession(session.id)}
                    >
                      {t('settings.logout')}
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="border-destructive">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-destructive/10 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <CardTitle className="text-destructive">{t('settings.dangerZone')}</CardTitle>
                <CardDescription>{t('settings.dangerZoneDescription')}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{t('settings.deleteAccount')}</p>
                <p className="text-sm text-muted-foreground">
                  {t('settings.deleteAccountDescription')}
                </p>
              </div>
              <Button variant="destructive">{t('settings.deleteAccount')}</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
