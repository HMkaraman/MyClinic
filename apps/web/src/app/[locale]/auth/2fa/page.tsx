'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { useAuthStore } from '@/stores/auth-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, ShieldCheck, ArrowLeft } from 'lucide-react';

export default function TwoFactorPage() {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const { verify2FA, isLoading, requires2FA, isAuthenticated, reset } = useAuthStore();

  const [code, setCode] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (isAuthenticated) {
      router.push(`/${locale}/dashboard`);
    } else if (!requires2FA) {
      router.push(`/${locale}/auth/login`);
    }
  }, [isAuthenticated, requires2FA, router, locale]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      await verify2FA(code);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('auth.invalidCode'));
    }
  };

  const handleBack = () => {
    reset();
    router.push(`/${locale}/auth/login`);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
            <ShieldCheck className="w-8 h-8 text-primary" />
          </div>
          <div>
            <CardTitle className="text-2xl">{t('auth.twoFactorAuth')}</CardTitle>
            <CardDescription className="mt-2">
              {t('auth.enter2FACode')}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="code">{t('auth.verificationCode')}</Label>
              <Input
                id="code"
                type="text"
                placeholder="000000"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                required
                autoComplete="one-time-code"
                className="text-center text-2xl tracking-widest"
                dir="ltr"
                maxLength={6}
              />
            </div>

            <Button type="submit" className="w-full" disabled={isLoading || code.length !== 6}>
              {isLoading ? (
                <>
                  <Loader2 className="me-2 h-4 w-4 animate-spin" />
                  {t('common.loading')}
                </>
              ) : (
                t('auth.verify')
              )}
            </Button>

            <Button
              type="button"
              variant="ghost"
              className="w-full"
              onClick={handleBack}
            >
              <ArrowLeft className="me-2 h-4 w-4 rtl:rotate-180" />
              {t('common.back')}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
