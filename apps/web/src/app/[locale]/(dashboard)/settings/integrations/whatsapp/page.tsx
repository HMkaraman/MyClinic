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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ArrowLeft,
  MessageCircle,
  CheckCircle,
  XCircle,
  Send,
  Eye,
  EyeOff,
  RefreshCw,
  Save,
  Loader2,
  FileText,
} from 'lucide-react';

interface WhatsAppConfig {
  accountSid: string;
  authToken: string;
  fromNumber: string;
  isEnabled: boolean;
}

interface MessageTemplate {
  id: string;
  name: string;
  content: string;
}

const mockTemplates: MessageTemplate[] = [
  {
    id: '1',
    name: 'Appointment Reminder',
    content: 'Hi {{name}}, this is a reminder for your appointment on {{date}} at {{time}}. Reply YES to confirm.',
  },
  {
    id: '2',
    name: 'Appointment Confirmation',
    content: 'Your appointment has been confirmed for {{date}} at {{time}}. See you at MyClinic!',
  },
  {
    id: '3',
    name: 'Follow-up',
    content: 'Hi {{name}}, how are you feeling after your visit? Please let us know if you have any concerns.',
  },
];

export default function WhatsAppIntegrationPage() {
  const t = useTranslations();
  const locale = useLocale();
  const [config, setConfig] = React.useState<WhatsAppConfig>({
    accountSid: '',
    authToken: '',
    fromNumber: '',
    isEnabled: false,
  });
  const [showToken, setShowToken] = React.useState(false);
  const [isTesting, setIsTesting] = React.useState(false);
  const [testResult, setTestResult] = React.useState<{ success: boolean; message: string } | null>(null);
  const [isSaving, setIsSaving] = React.useState(false);
  const [isTestDialogOpen, setIsTestDialogOpen] = React.useState(false);
  const [testPhone, setTestPhone] = React.useState('');
  const [selectedTemplate, setSelectedTemplate] = React.useState('');
  const [customMessage, setCustomMessage] = React.useState('');

  const handleSave = async () => {
    setIsSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsSaving(false);
    setTestResult({ success: true, message: 'Configuration saved successfully!' });
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setIsTesting(false);
    if (config.accountSid && config.authToken) {
      setTestResult({ success: true, message: 'Connection successful! WhatsApp Business API is ready.' });
    } else {
      setTestResult({ success: false, message: 'Please enter your credentials first.' });
    }
  };

  const handleSendTestMessage = async () => {
    if (!testPhone) return;
    setIsTesting(true);
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
            <div className="rounded-full bg-green-100 p-3">
              <MessageCircle className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                {t('integrations.whatsapp.title') || 'WhatsApp Business'}
              </h1>
              <p className="text-muted-foreground">
                {t('integrations.whatsapp.description') || 'Configure WhatsApp Business API via Twilio'}
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
          <CardTitle>{t('integrations.whatsapp.credentials') || 'Twilio WhatsApp Credentials'}</CardTitle>
          <CardDescription>
            {t('integrations.whatsapp.credentialsDescription') ||
              'Enter your Twilio WhatsApp Business API credentials'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="accountSid">
                {t('integrations.whatsapp.accountSid') || 'Account SID'}
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
                {t('integrations.whatsapp.authToken') || 'Auth Token'}
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
                  {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="fromNumber">
              {t('integrations.whatsapp.fromNumber') || 'WhatsApp Number'}
            </Label>
            <Input
              id="fromNumber"
              value={config.fromNumber}
              onChange={(e) => setConfig({ ...config, fromNumber: e.target.value })}
              placeholder="whatsapp:+1234567890"
            />
            <p className="text-sm text-muted-foreground">
              {t('integrations.whatsapp.fromNumberHelp') ||
                'Your WhatsApp Business number in the format: whatsapp:+1234567890'}
            </p>
          </div>

          <div className="flex items-center justify-between py-4 border-t">
            <div>
              <Label htmlFor="enabled">{t('integrations.whatsapp.enableWhatsApp') || 'Enable WhatsApp'}</Label>
              <p className="text-sm text-muted-foreground">
                {t('integrations.whatsapp.enableWhatsAppHelp') || 'Turn WhatsApp messaging on or off'}
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

      {/* Message Templates */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {t('integrations.whatsapp.templates') || 'Message Templates'}
          </CardTitle>
          <CardDescription>
            {t('integrations.whatsapp.templatesDescription') ||
              'Pre-approved message templates for WhatsApp Business'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {mockTemplates.map((template) => (
              <div key={template.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">{template.name}</h4>
                  <Badge variant="secondary">Template</Badge>
                </div>
                <p className="text-sm text-muted-foreground bg-muted p-3 rounded">
                  {template.content}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Test Message */}
      <Card>
        <CardHeader>
          <CardTitle>{t('integrations.whatsapp.testMessage') || 'Send Test Message'}</CardTitle>
          <CardDescription>
            {t('integrations.whatsapp.testMessageDescription') ||
              'Send a test WhatsApp message to verify your configuration'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Dialog open={isTestDialogOpen} onOpenChange={setIsTestDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" disabled={!config.isEnabled}>
                <Send className="me-2 h-4 w-4" />
                {t('integrations.whatsapp.sendTest') || 'Send Test WhatsApp'}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t('integrations.whatsapp.sendTestMessage') || 'Send Test WhatsApp'}</DialogTitle>
                <DialogDescription>
                  {t('integrations.whatsapp.sendTestMessageDescription') ||
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
                  <Label>{t('integrations.whatsapp.template') || 'Template'}</Label>
                  <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                    <SelectTrigger>
                      <SelectValue placeholder={t('integrations.whatsapp.selectTemplate') || 'Select template'} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="custom">{t('integrations.whatsapp.customMessage') || 'Custom Message'}</SelectItem>
                      {mockTemplates.map((template) => (
                        <SelectItem key={template.id} value={template.id}>
                          {template.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {selectedTemplate === 'custom' && (
                  <div className="grid gap-2">
                    <Label htmlFor="customMessage">{t('common.message') || 'Message'}</Label>
                    <Textarea
                      id="customMessage"
                      value={customMessage}
                      onChange={(e) => setCustomMessage(e.target.value)}
                      rows={3}
                      placeholder="Enter your custom message..."
                    />
                  </div>
                )}
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
          <CardTitle>{t('integrations.whatsapp.usage') || 'WhatsApp Usage'}</CardTitle>
          <CardDescription>
            {t('integrations.whatsapp.usageDescription') || 'Your WhatsApp usage this month'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="text-center p-4 border rounded-lg">
              <p className="text-3xl font-bold">0</p>
              <p className="text-sm text-muted-foreground">{t('integrations.whatsapp.messagesSent') || 'Messages Sent'}</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <p className="text-3xl font-bold">--</p>
              <p className="text-sm text-muted-foreground">{t('integrations.whatsapp.deliveryRate') || 'Delivery Rate'}</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <p className="text-3xl font-bold">$0.00</p>
              <p className="text-sm text-muted-foreground">{t('integrations.whatsapp.cost') || 'Cost This Month'}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
