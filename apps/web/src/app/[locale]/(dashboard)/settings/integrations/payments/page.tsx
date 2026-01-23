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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ArrowLeft,
  CreditCard,
  CheckCircle,
  XCircle,
  Eye,
  EyeOff,
  RefreshCw,
  Save,
  Loader2,
  Globe,
  Star,
} from 'lucide-react';

interface PaymentProvider {
  id: string;
  name: string;
  description: string;
  logo: string;
  isConfigured: boolean;
  isEnabled: boolean;
  isDefault: boolean;
  region: string;
  credentials: {
    publicKey?: string;
    secretKey?: string;
    merchantId?: string;
    accessCode?: string;
  };
}

const mockProviders: PaymentProvider[] = [
  {
    id: 'stripe',
    name: 'Stripe',
    description: 'Global payment processing platform',
    logo: '💳',
    isConfigured: true,
    isEnabled: true,
    isDefault: true,
    region: 'Global',
    credentials: {
      publicKey: 'pk_test_51234567890abcdef',
      secretKey: '',
    },
  },
  {
    id: 'tap',
    name: 'Tap Payments',
    description: 'Payment gateway for Middle East & North Africa',
    logo: '🌙',
    isConfigured: false,
    isEnabled: false,
    isDefault: false,
    region: 'MENA',
    credentials: {
      publicKey: '',
      secretKey: '',
    },
  },
  {
    id: 'hyperpay',
    name: 'HyperPay',
    description: 'Payment solutions for GCC region',
    logo: '💰',
    isConfigured: false,
    isEnabled: false,
    isDefault: false,
    region: 'GCC',
    credentials: {
      merchantId: '',
      accessCode: '',
    },
  },
];

export default function PaymentsIntegrationPage() {
  const t = useTranslations();
  const locale = useLocale();
  const [providers, setProviders] = React.useState(mockProviders);
  const [activeTab, setActiveTab] = React.useState('stripe');
  const [showSecrets, setShowSecrets] = React.useState<Record<string, boolean>>({});
  const [isTesting, setIsTesting] = React.useState(false);
  const [testResult, setTestResult] = React.useState<{ success: boolean; message: string } | null>(null);
  const [isSaving, setIsSaving] = React.useState(false);

  const updateProvider = (id: string, updates: Partial<PaymentProvider>) => {
    setProviders(
      providers.map((p) => (p.id === id ? { ...p, ...updates } : p))
    );
  };

  const updateCredential = (providerId: string, key: string, value: string) => {
    setProviders(
      providers.map((p) =>
        p.id === providerId
          ? { ...p, credentials: { ...p.credentials, [key]: value } }
          : p
      )
    );
  };

  const handleSetDefault = (id: string) => {
    setProviders(
      providers.map((p) => ({
        ...p,
        isDefault: p.id === id,
      }))
    );
  };

  const handleSave = async (providerId: string) => {
    setIsSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsSaving(false);
    updateProvider(providerId, { isConfigured: true });
    setTestResult({ success: true, message: 'Configuration saved successfully!' });
  };

  const handleTestConnection = async (providerId: string) => {
    setIsTesting(true);
    setTestResult(null);
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setIsTesting(false);
    const provider = providers.find((p) => p.id === providerId);
    if (provider?.credentials.publicKey || provider?.credentials.merchantId) {
      setTestResult({ success: true, message: `${provider.name} connection successful!` });
    } else {
      setTestResult({ success: false, message: 'Please enter your credentials first.' });
    }
  };

  const toggleShowSecret = (key: string) => {
    setShowSecrets({ ...showSecrets, [key]: !showSecrets[key] });
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
              <CreditCard className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                {t('integrations.payments.title') || 'Payment Gateways'}
              </h1>
              <p className="text-muted-foreground">
                {t('integrations.payments.description') || 'Configure payment processing providers'}
              </p>
            </div>
          </div>
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

      {/* Provider Cards Overview */}
      <div className="grid gap-4 md:grid-cols-3">
        {providers.map((provider) => (
          <Card
            key={provider.id}
            className={`cursor-pointer transition-all ${
              activeTab === provider.id ? 'ring-2 ring-primary' : ''
            }`}
            onClick={() => setActiveTab(provider.id)}
          >
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{provider.logo}</span>
                  <div>
                    <h3 className="font-medium flex items-center gap-2">
                      {provider.name}
                      {provider.isDefault && (
                        <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                      )}
                    </h3>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Globe className="h-3 w-3" />
                      {provider.region}
                    </p>
                  </div>
                </div>
                <Badge
                  variant={provider.isEnabled ? 'success' : 'secondary'}
                  className="flex items-center gap-1"
                >
                  {provider.isEnabled ? (
                    <>
                      <CheckCircle className="h-3 w-3" />
                      Active
                    </>
                  ) : (
                    <>
                      <XCircle className="h-3 w-3" />
                      Inactive
                    </>
                  )}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-3">{provider.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Configuration Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="stripe">Stripe</TabsTrigger>
          <TabsTrigger value="tap">Tap Payments</TabsTrigger>
          <TabsTrigger value="hyperpay">HyperPay</TabsTrigger>
        </TabsList>

        <TabsContent value="stripe" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Stripe Configuration</span>
                {providers.find((p) => p.id === 'stripe')?.isDefault && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <Star className="h-3 w-3" />
                    Default
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                Configure your Stripe account for global payment processing
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-2">
                  <Label>Publishable Key</Label>
                  <Input
                    value={providers.find((p) => p.id === 'stripe')?.credentials.publicKey || ''}
                    onChange={(e) => updateCredential('stripe', 'publicKey', e.target.value)}
                    placeholder="pk_test_..."
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Secret Key</Label>
                  <div className="relative">
                    <Input
                      type={showSecrets['stripe-secret'] ? 'text' : 'password'}
                      value={providers.find((p) => p.id === 'stripe')?.credentials.secretKey || ''}
                      onChange={(e) => updateCredential('stripe', 'secretKey', e.target.value)}
                      placeholder="sk_test_..."
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute end-0 top-0 h-full px-3"
                      onClick={() => toggleShowSecret('stripe-secret')}
                    >
                      {showSecrets['stripe-secret'] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between py-4 border-t">
                <div>
                  <Label>Enable Stripe</Label>
                  <p className="text-sm text-muted-foreground">Accept payments via Stripe</p>
                </div>
                <Switch
                  checked={providers.find((p) => p.id === 'stripe')?.isEnabled || false}
                  onCheckedChange={(checked) => updateProvider('stripe', { isEnabled: checked })}
                />
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => handleTestConnection('stripe')} disabled={isTesting}>
                  {isTesting ? <Loader2 className="me-2 h-4 w-4 animate-spin" /> : <RefreshCw className="me-2 h-4 w-4" />}
                  Test
                </Button>
                {!providers.find((p) => p.id === 'stripe')?.isDefault && (
                  <Button variant="outline" onClick={() => handleSetDefault('stripe')}>
                    <Star className="me-2 h-4 w-4" />
                    Set as Default
                  </Button>
                )}
              </div>
              <Button onClick={() => handleSave('stripe')} disabled={isSaving}>
                {isSaving ? <Loader2 className="me-2 h-4 w-4 animate-spin" /> : <Save className="me-2 h-4 w-4" />}
                Save
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="tap" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Tap Payments Configuration</span>
                {providers.find((p) => p.id === 'tap')?.isDefault && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <Star className="h-3 w-3" />
                    Default
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                Configure Tap Payments for MENA region payment processing
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-2">
                  <Label>Public Key</Label>
                  <Input
                    value={providers.find((p) => p.id === 'tap')?.credentials.publicKey || ''}
                    onChange={(e) => updateCredential('tap', 'publicKey', e.target.value)}
                    placeholder="pk_test_..."
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Secret Key</Label>
                  <div className="relative">
                    <Input
                      type={showSecrets['tap-secret'] ? 'text' : 'password'}
                      value={providers.find((p) => p.id === 'tap')?.credentials.secretKey || ''}
                      onChange={(e) => updateCredential('tap', 'secretKey', e.target.value)}
                      placeholder="sk_test_..."
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute end-0 top-0 h-full px-3"
                      onClick={() => toggleShowSecret('tap-secret')}
                    >
                      {showSecrets['tap-secret'] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between py-4 border-t">
                <div>
                  <Label>Enable Tap Payments</Label>
                  <p className="text-sm text-muted-foreground">Accept payments via Tap</p>
                </div>
                <Switch
                  checked={providers.find((p) => p.id === 'tap')?.isEnabled || false}
                  onCheckedChange={(checked) => updateProvider('tap', { isEnabled: checked })}
                />
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => handleTestConnection('tap')} disabled={isTesting}>
                  {isTesting ? <Loader2 className="me-2 h-4 w-4 animate-spin" /> : <RefreshCw className="me-2 h-4 w-4" />}
                  Test
                </Button>
                {!providers.find((p) => p.id === 'tap')?.isDefault && (
                  <Button variant="outline" onClick={() => handleSetDefault('tap')}>
                    <Star className="me-2 h-4 w-4" />
                    Set as Default
                  </Button>
                )}
              </div>
              <Button onClick={() => handleSave('tap')} disabled={isSaving}>
                {isSaving ? <Loader2 className="me-2 h-4 w-4 animate-spin" /> : <Save className="me-2 h-4 w-4" />}
                Save
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="hyperpay" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>HyperPay Configuration</span>
                {providers.find((p) => p.id === 'hyperpay')?.isDefault && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <Star className="h-3 w-3" />
                    Default
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                Configure HyperPay for GCC region payment processing
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-2">
                  <Label>Entity ID / Merchant ID</Label>
                  <Input
                    value={providers.find((p) => p.id === 'hyperpay')?.credentials.merchantId || ''}
                    onChange={(e) => updateCredential('hyperpay', 'merchantId', e.target.value)}
                    placeholder="8a8294174..."
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Access Code / Bearer Token</Label>
                  <div className="relative">
                    <Input
                      type={showSecrets['hyperpay-secret'] ? 'text' : 'password'}
                      value={providers.find((p) => p.id === 'hyperpay')?.credentials.accessCode || ''}
                      onChange={(e) => updateCredential('hyperpay', 'accessCode', e.target.value)}
                      placeholder="OGE4M..."
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute end-0 top-0 h-full px-3"
                      onClick={() => toggleShowSecret('hyperpay-secret')}
                    >
                      {showSecrets['hyperpay-secret'] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between py-4 border-t">
                <div>
                  <Label>Enable HyperPay</Label>
                  <p className="text-sm text-muted-foreground">Accept payments via HyperPay</p>
                </div>
                <Switch
                  checked={providers.find((p) => p.id === 'hyperpay')?.isEnabled || false}
                  onCheckedChange={(checked) => updateProvider('hyperpay', { isEnabled: checked })}
                />
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => handleTestConnection('hyperpay')} disabled={isTesting}>
                  {isTesting ? <Loader2 className="me-2 h-4 w-4 animate-spin" /> : <RefreshCw className="me-2 h-4 w-4" />}
                  Test
                </Button>
                {!providers.find((p) => p.id === 'hyperpay')?.isDefault && (
                  <Button variant="outline" onClick={() => handleSetDefault('hyperpay')}>
                    <Star className="me-2 h-4 w-4" />
                    Set as Default
                  </Button>
                )}
              </div>
              <Button onClick={() => handleSave('hyperpay')} disabled={isSaving}>
                {isSaving ? <Loader2 className="me-2 h-4 w-4 animate-spin" /> : <Save className="me-2 h-4 w-4" />}
                Save
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Transaction Stats */}
      <Card>
        <CardHeader>
          <CardTitle>{t('integrations.payments.transactions') || 'Transaction Overview'}</CardTitle>
          <CardDescription>
            {t('integrations.payments.transactionsDescription') || 'Payment processing statistics this month'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="text-center p-4 border rounded-lg">
              <p className="text-3xl font-bold">127</p>
              <p className="text-sm text-muted-foreground">{t('integrations.payments.totalTransactions') || 'Total Transactions'}</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <p className="text-3xl font-bold">$8,540</p>
              <p className="text-sm text-muted-foreground">{t('integrations.payments.totalVolume') || 'Total Volume'}</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <p className="text-3xl font-bold">99.2%</p>
              <p className="text-sm text-muted-foreground">{t('integrations.payments.successRate') || 'Success Rate'}</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <p className="text-3xl font-bold">$67.24</p>
              <p className="text-sm text-muted-foreground">{t('integrations.payments.avgTransaction') || 'Avg. Transaction'}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
