'use client';

import * as React from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DollarSign,
  TrendingUp,
  Receipt,
  CreditCard,
  ArrowRight,
  Plus,
} from 'lucide-react';

const mockStats = {
  todayRevenue: 450000,
  weekRevenue: 2500000,
  monthRevenue: 8500000,
  pendingPayments: 575000,
  revenueChange: 12.5,
};

const mockRecentInvoices = [
  {
    id: '1',
    number: 'INV-2024-001',
    patientName: 'أحمد محمد علي',
    date: '2024-01-18',
    total: 250000,
    status: 'paid',
  },
  {
    id: '2',
    number: 'INV-2024-002',
    patientName: 'فاطمة حسين',
    date: '2024-01-17',
    total: 150000,
    status: 'partial',
  },
  {
    id: '3',
    number: 'INV-2024-003',
    patientName: 'محمود سعيد',
    date: '2024-01-16',
    total: 100000,
    status: 'pending',
  },
];

const mockRecentPayments = [
  {
    id: '1',
    invoiceNumber: 'INV-2024-001',
    patientName: 'أحمد محمد علي',
    date: '2024-01-18',
    amount: 250000,
    method: 'CASH',
  },
  {
    id: '2',
    invoiceNumber: 'INV-2024-002',
    patientName: 'فاطمة حسين',
    date: '2024-01-17',
    amount: 75000,
    method: 'CARD',
  },
  {
    id: '3',
    invoiceNumber: 'INV-2024-004',
    patientName: 'نور الهدى',
    date: '2024-01-15',
    amount: 300000,
    method: 'CASH',
  },
];

const paymentMethodLabels: Record<string, string> = {
  CASH: 'نقدي',
  CARD: 'بطاقة',
  BANK_TRANSFER: 'تحويل بنكي',
};

export default function FinancePage() {
  const t = useTranslations();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {t('finance.title')}
          </h1>
          <p className="text-muted-foreground">
            {t('finance.overview')}
          </p>
        </div>
        <Button asChild>
          <Link href="/finance/invoices/new">
            <Plus className="me-2 h-4 w-4" />
            {t('finance.newInvoice')}
          </Link>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                <DollarSign className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{mockStats.todayRevenue.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">{t('finance.todayRevenue')} (IQD)</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{mockStats.weekRevenue.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">{t('finance.weekRevenue')} (IQD)</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                <Receipt className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{mockStats.monthRevenue.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">{t('finance.monthRevenue')} (IQD)</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
                <CreditCard className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{mockStats.pendingPayments.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">{t('finance.pendingPayments')} (IQD)</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Links */}
      <div className="grid gap-4 md:grid-cols-3">
        <Link href="/finance/invoices">
          <Card className="hover:border-primary transition-colors cursor-pointer">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Receipt className="h-5 w-5 text-muted-foreground" />
                  <span className="font-medium">{t('finance.invoices')}</span>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground rtl:rotate-180" />
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/finance/payments">
          <Card className="hover:border-primary transition-colors cursor-pointer">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CreditCard className="h-5 w-5 text-muted-foreground" />
                  <span className="font-medium">{t('finance.payments')}</span>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground rtl:rotate-180" />
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/finance/reports">
          <Card className="hover:border-primary transition-colors cursor-pointer">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <TrendingUp className="h-5 w-5 text-muted-foreground" />
                  <span className="font-medium">{t('finance.reports')}</span>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground rtl:rotate-180" />
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Invoices */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{t('finance.recentInvoices')}</CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/finance/invoices">
                  {t('common.viewAll')}
                  <ArrowRight className="ms-2 h-4 w-4 rtl:rotate-180" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('finance.invoiceNumber')}</TableHead>
                  <TableHead>{t('patients.patientName')}</TableHead>
                  <TableHead>{t('finance.total')}</TableHead>
                  <TableHead>{t('common.status')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockRecentInvoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell>
                      <Link
                        href={`/finance/invoices/${invoice.id}`}
                        className="text-primary hover:underline"
                      >
                        {invoice.number}
                      </Link>
                    </TableCell>
                    <TableCell>{invoice.patientName}</TableCell>
                    <TableCell>{invoice.total.toLocaleString()} IQD</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          invoice.status === 'paid'
                            ? 'success'
                            : invoice.status === 'partial'
                            ? 'warning'
                            : 'secondary'
                        }
                      >
                        {t(`finance.status.${invoice.status}`)}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Recent Payments */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{t('finance.recentPayments')}</CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/finance/payments">
                  {t('common.viewAll')}
                  <ArrowRight className="ms-2 h-4 w-4 rtl:rotate-180" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('finance.invoiceNumber')}</TableHead>
                  <TableHead>{t('patients.patientName')}</TableHead>
                  <TableHead>{t('finance.amount')}</TableHead>
                  <TableHead>{t('finance.paymentMethod')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockRecentPayments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell>{payment.invoiceNumber}</TableCell>
                    <TableCell>{payment.patientName}</TableCell>
                    <TableCell>{payment.amount.toLocaleString()} IQD</TableCell>
                    <TableCell>{paymentMethodLabels[payment.method]}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
