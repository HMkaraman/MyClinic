'use client';

import * as React from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
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
  AlertCircle,
} from 'lucide-react';
import {
  useFinanceStats,
  useRecentInvoices,
  useRecentPayments,
  type PaymentMethod,
} from '@/hooks/use-invoices';

const paymentMethodLabels: Record<PaymentMethod, string> = {
  CASH: 'نقدي',
  CARD: 'بطاقة',
  BANK_TRANSFER: 'تحويل بنكي',
  INSURANCE: 'تأمين',
  OTHER: 'أخرى',
};

const statusVariants: Record<string, 'success' | 'warning' | 'secondary' | 'destructive'> = {
  PAID: 'success',
  PARTIAL: 'warning',
  PENDING: 'secondary',
  DRAFT: 'secondary',
  CANCELLED: 'destructive',
  REFUNDED: 'destructive',
};

export default function FinancePage() {
  const t = useTranslations();

  const { data: stats, isLoading: isLoadingStats, isError: isStatsError } = useFinanceStats();
  const { data: recentInvoices, isLoading: isLoadingInvoices } = useRecentInvoices(5);
  const { data: recentPayments, isLoading: isLoadingPayments } = useRecentPayments(5);

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

      {/* Error State */}
      {isStatsError && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              <span>{t('common.errorLoading') || 'Error loading data'}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                <DollarSign className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                {isLoadingStats ? (
                  <Skeleton className="h-8 w-24" />
                ) : (
                  <p className="text-2xl font-bold">
                    {(stats?.todayRevenue ?? 0).toLocaleString()}
                  </p>
                )}
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
                {isLoadingStats ? (
                  <Skeleton className="h-8 w-24" />
                ) : (
                  <p className="text-2xl font-bold">
                    {(stats?.weekRevenue ?? 0).toLocaleString()}
                  </p>
                )}
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
                {isLoadingStats ? (
                  <Skeleton className="h-8 w-24" />
                ) : (
                  <p className="text-2xl font-bold">
                    {(stats?.monthRevenue ?? 0).toLocaleString()}
                  </p>
                )}
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
                {isLoadingStats ? (
                  <Skeleton className="h-8 w-24" />
                ) : (
                  <p className="text-2xl font-bold">
                    {(stats?.pendingPayments ?? 0).toLocaleString()}
                  </p>
                )}
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
            {isLoadingInvoices ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <Skeleton className="h-10 w-24" />
                    <Skeleton className="h-10 flex-1" />
                    <Skeleton className="h-10 w-24" />
                    <Skeleton className="h-10 w-20" />
                  </div>
                ))}
              </div>
            ) : !recentInvoices || recentInvoices.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {t('finance.noInvoices') || 'No invoices yet'}
              </div>
            ) : (
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
                  {recentInvoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell>
                        <Link
                          href={`/finance/invoices/${invoice.id}`}
                          className="text-primary hover:underline"
                        >
                          {invoice.invoiceNumber}
                        </Link>
                      </TableCell>
                      <TableCell>{invoice.patient?.name}</TableCell>
                      <TableCell>{invoice.total.toLocaleString()} IQD</TableCell>
                      <TableCell>
                        <Badge variant={statusVariants[invoice.status] || 'secondary'}>
                          {t(`finance.status.${invoice.status.toLowerCase()}`)}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
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
            {isLoadingPayments ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <Skeleton className="h-10 w-24" />
                    <Skeleton className="h-10 flex-1" />
                    <Skeleton className="h-10 w-24" />
                    <Skeleton className="h-10 w-20" />
                  </div>
                ))}
              </div>
            ) : !recentPayments || recentPayments.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {t('finance.noPayments') || 'No payments yet'}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('finance.invoiceNumber')}</TableHead>
                    <TableHead>{t('common.date')}</TableHead>
                    <TableHead>{t('finance.amount')}</TableHead>
                    <TableHead>{t('finance.paymentMethod')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentPayments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell>{payment.invoiceId}</TableCell>
                      <TableCell>{new Date(payment.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell>{payment.amount.toLocaleString()} IQD</TableCell>
                      <TableCell>
                        {paymentMethodLabels[payment.method] || payment.method}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
