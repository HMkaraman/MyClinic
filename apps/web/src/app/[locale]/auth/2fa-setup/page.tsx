'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { ShieldCheck, Loader2, ArrowLeft, Copy, Check } from 'lucide-react';

import { useAuthStore } from '@/stores/auth-store';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function TwoFactorSetupPage() {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const {
    requires2FASetup,
    setupToken,
    qrCode,
    secret,
    isLoading,
    isAuthenticated,
    initiate2FASetup,
    complete2FASetup,
    cancelSetup,
  } = useAuthStore();

  const [code, setCode] = React.useState('');
  const [error, setError] = React.useState('');
  const [step, setStep] = React.useState<'qr' | 'verify'>('qr');
  const [copied, setCopied] = React.useState(false);

  // Redirect guards
  React.useEffect(() => {
    if (isAuthenticated) {
      router.push(`/${locale}/dashboard`);
    } else if (!requires2FASetup || !setupToken) {
      router.push(`/${locale}/auth/login`);
    }
  }, [isAuthenticated, requires2FASetup, setupToken, router, locale]);

  // Initiate setup on mount
  React.useEffect(() => {
    if (setupToken && !qrCode && !isLoading) {
      initiate2FASetup().catch((err) => {
        setError(err.message);
      });
    }
  }, [setupToken, qrCode, isLoading, initiate2FASetup]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await complete2FASetup(code);
      // Will redirect via effect
    } catch (err: unknown) {
      const error = err as { message?: string };
      setError(error.message || t('auth.invalidCode'));
    }
  };

  const handleCopySecret = () => {
    if (secret) {
      navigator.clipboard.writeText(secret);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleBack = () => {
    cancelSetup();
    router.push(`/${locale}/auth/login`);
  };

  if (!requires2FASetup) return null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
            <ShieldCheck className="w-6 h-6 text-primary" />
          </div>
          <CardTitle>{t('auth.twoFactorSetup')}</CardTitle>
          <CardDescription>{t('auth.twoFactorSetupRequired')}</CardDescription>
        </CardHeader>

        <CardContent>
          {step === 'qr' && (
            <div className="space-y-4">
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin" />
                </div>
              ) : qrCode ? (
                <>
                  <p className="text-sm text-center text-muted-foreground">
                    {t('auth.scanQRCode')}
                  </p>
                  <div className="flex justify-center">
                    <img
                      src={qrCode}
                      alt="2FA QR Code"
                      className="w-48 h-48"
                    />
                  </div>
                  {secret && (
                    <div className="space-y-2">
                      <p className="text-xs text-center text-muted-foreground">
                        {t('auth.orEnterManually')}
                      </p>
                      <div className="flex items-center gap-2 p-2 bg-muted rounded font-mono text-sm">
                        <span className="flex-1 break-all text-center">
                          {secret}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={handleCopySecret}
                          className="shrink-0"
                        >
                          {copied ? (
                            <Check className="w-4 h-4" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  )}
                  <Button className="w-full" onClick={() => setStep('verify')}>
                    {t('common.next')}
                  </Button>
                </>
              ) : error ? (
                <div className="text-center space-y-4">
                  <p className="text-destructive">{error}</p>
                  <Button variant="outline" onClick={handleBack}>
                    {t('auth.backToLogin')}
                  </Button>
                </div>
              ) : null}
            </div>
          )}

          {step === 'verify' && (
            <form onSubmit={handleVerify} className="space-y-4">
              <p className="text-sm text-center text-muted-foreground">
                {t('auth.enterSetupCode')}
              </p>

              <div className="space-y-2">
                <Label htmlFor="code">{t('auth.verificationCode')}</Label>
                <Input
                  id="code"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="000000"
                  className="text-center text-2xl tracking-widest"
                  autoFocus
                  dir="ltr"
                />
              </div>

              {error && (
                <div className="p-3 text-sm text-destructive bg-destructive/10 rounded">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={code.length !== 6 || isLoading}
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin me-2" />
                ) : null}
                {t('auth.completeSetup')}
              </Button>

              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={() => setStep('qr')}
              >
                <ArrowLeft className="w-4 h-4 me-2" />
                {t('common.back')}
              </Button>
            </form>
          )}

          <div className="mt-4 pt-4 border-t">
            <Button
              variant="link"
              className="w-full text-muted-foreground"
              onClick={handleBack}
            >
              {t('auth.backToLogin')}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
