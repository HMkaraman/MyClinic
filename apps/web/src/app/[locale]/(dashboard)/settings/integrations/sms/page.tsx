'use client';

import * as React from 'react';
import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
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
  MessageSquare,
  CheckCircle,
  XCircle,
  Send,
  Eye,
  EyeOff,
  RefreshCw,
  Save,
  Loader2,
} from 'lucide-react';

interface SMSConfig {
  accountSid: string;
  authToken: string;
  fromNumber: string;
  isEnabled: boolean;
}

export default function SMSIntegrationPage() {
  const t = useTranslations();
  const locale = useLocale();
  const [config, setConfig] = React.useState<SMSConfig>({
    accountSid: '',
    authToken: '',
    fromNumber: '',
    isEnabled: true,
  });
  const [showToken, setShowToken] = React.useState(false);
  const [isTesting, setIsTesting] = React.useState(false);
  const [testResult, setTestResult] = React.useState<{ success: boolean; message: string } | null>(null);
  const [isSaving, setIsSaving] = React.useState(false);
  const [isTestDialogOpen, setIsTestDialogOpen] = React.useState(false);
  const [testPhone, setTestPhone] = React.useState('');
  const [testMessage, setTestMessage] = React.useState('This is a test message from MyClinic.');

  const handleSave = async () => {
    setIsSaving(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsSaving(false);
    setTestResult({ success: true, message: 'Configuration saved successfully!' });
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setIsTesting(false);
    setTestResult({ success: true, message: 'Connection successful! Twilio credentials are valid.' });
  };

  const handleSendTestMessage = async () => {
    if (!testPhone) return;
    setIsTesting(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setIsTesting(false);
    setTestResult({ success: true, message: `Test message sent to ${testPhone}` });
    setIsTestDialogOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/${locale}/settings/integrations`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-primary/10 p-3">
              <MessageSquare className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                {t('integrations.sms.title') || 'SMS Integration'}
              </h1>
              <p className="text-muted-foreground">
                {t('integrations.sms.description') || 'Configure Twilio for SMS messaging'}
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={config.isEnabled ? 'success' : 'secondary'} className="flex items-center gap-1">
            {config.isEnabled ? (
              <>
                <CheckCircle className="h-3 w-3" />
                {t('common.enabled') || 'Enabled'}
              </>
            ) : (
              <>
                <XCircle className="h-3 w-3" />
                {t('common.disabled') || 'Disabled'}
              </>
            )}
          </Badge>
        </div>
      </div>

      {/* Status Message */}
      {testResult && (
        <Card className={testResult.success ? 'border-success' : 'border-destructive'}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              {testResult.success ? (
                <CheckCircle className="h-5 w-5 text-success" />
              ) : (
                <XCircle className="h-5 w-5 text-destructive" />
              )}
              <span>{testResult.message}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Configuration Form */}
      <Card>
        <CardHeader>
          <CardTitle>{t('integrations.sms.credentials') || 'Twilio Credentials'}</CardTitle>
          <CardDescription>
            {t('integrations.sms.credentialsDescription') ||
              'Enter your Twilio account credentials. You can find these in your Twilio Console.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="accountSid">
                {t('integrations.sms.accountSid') || 'Account SID'}
              </Label>
              <Input
                id="accountSid"
                value={config.accountSid}
                onChange={(e) => setConfig({ ...config, accountSid: e.target.value })}
                placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="authToken">
                {t('integrations.sms.authToken') || 'Auth Token'}
              </Label>
              <div className="relative">
                <Input
                  id="authToken"
                  type={showToken ? 'text' : 'password'}
                  value={config.authToken}
                  onChange={(e) => setConfig({ ...config, authToken: e.target.value })}
                  placeholder="Enter your auth token"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute end-0 top-0 h-full px-3"
                  onClick={() => setShowToken(!showToken)}
                >
                  {showToken ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="fromNumber">
              {t('integrations.sms.fromNumber') || 'From Number'}
            </Label>
            <Input
              id="fromNumber"
              value={config.fromNumber}
              onChange={(e) => setConfig({ ...config, fromNumber: e.target.value })}
              placeholder="+1234567890"
            />
            <p className="text-sm text-muted-foreground">
              {t('integrations.sms.fromNumberHelp') ||
                'Your Twilio phone number that will be used to send SMS messages'}
            </p>
          </div>

          <div className="flex items-center justify-between py-4 border-t">
            <div>
              <Label htmlFor="enabled">{t('integrations.sms.enableSMS') || 'Enable SMS'}</Label>
              <p className="text-sm text-muted-foreground">
                {t('integrations.sms.enableSMSHelp') || 'Turn SMS messaging on or off'}
              </p>
            </div>
            <Switch
              id="enabled"
              checked={config.isEnabled}
              onCheckedChange={(checked) => setConfig({ ...config, isEnabled: checked })}
            />
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={handleTestConnection} disabled={isTesting}>
            {isTesting ? (
              <>
                <Loader2 className="me-2 h-4 w-4 animate-spin" />
                {t('integrations.testing') || 'Testing...'}
              </>
            ) : (
              <>
                <RefreshCw className="me-2 h-4 w-4" />
                {t('integrations.testConnection') || 'Test Connection'}
              </>
            )}
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="me-2 h-4 w-4 animate-spin" />
                {t('common.saving') || 'Saving...'}
              </>
            ) : (
              <>
                <Save className="me-2 h-4 w-4" />
                {t('common.save') || 'Save'}
              </>
            )}
          </Button>
        </CardFooter>
      </Card>

      {/* Test Message */}
      <Card>
        <CardHeader>
          <CardTitle>{t('integrations.sms.testMessage') || 'Send Test Message'}</CardTitle>
          <CardDescription>
            {t('integrations.sms.testMessageDescription') ||
              'Send a test SMS to verify your configuration is working'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Dialog open={isTestDialogOpen} onOpenChange={setIsTestDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Send className="me-2 h-4 w-4" />
                {t('integrations.sms.sendTest') || 'Send Test SMS'}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t('integrations.sms.sendTestMessage') || 'Send Test SMS'}</DialogTitle>
                <DialogDescription>
                  {t('integrations.sms.sendTestMessageDescription') ||
                    'Enter a phone number to receive the test message'}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="testPhone">{t('common.phone') || 'Phone Number'}</Label>
                  <Input
                    id="testPhone"
                    value={testPhone}
                    onChange={(e) => setTestPhone(e.target.value)}
                    placeholder="+1234567890"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="testMessage">{t('common.message') || 'Message'}</Label>
                  <Textarea
                    id="testMessage"
                    value={testMessage}
                    onChange={(e) => setTestMessage(e.target.value)}
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsTestDialogOpen(false)}>
                  {t('common.cancel') || 'Cancel'}
                </Button>
                <Button onClick={handleSendTestMessage} disabled={!testPhone || isTesting}>
                  {isTesting ? (
                    <>
                      <Loader2 className="me-2 h-4 w-4 animate-spin" />
                      {t('common.sending') || 'Sending...'}
                    </>
                  ) : (
                    <>
                      <Send className="me-2 h-4 w-4" />
                      {t('common.send') || 'Send'}
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>

      {/* Usage Information */}
      <Card>
        <CardHeader>
          <CardTitle>{t('integrations.sms.usage') || 'SMS Usage'}</CardTitle>
          <CardDescription>
            {t('integrations.sms.usageDescription') || 'Your SMS usage this month'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="text-center p-4 border rounded-lg">
              <p className="text-3xl font-bold">156</p>
              <p className="text-sm text-muted-foreground">{t('integrations.sms.messagesSent') || 'Messages Sent'}</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <p className="text-3xl font-bold">98%</p>
              <p className="text-sm text-muted-foreground">{t('integrations.sms.deliveryRate') || 'Delivery Rate'}</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <p className="text-3xl font-bold">$12.48</p>
              <p className="text-sm text-muted-foreground">{t('integrations.sms.cost') || 'Cost This Month'}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
