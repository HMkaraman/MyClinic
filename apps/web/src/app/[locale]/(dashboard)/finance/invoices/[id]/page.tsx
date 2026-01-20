'use client';

import * as React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from '@/components/ui/table';
import {
  ArrowLeft,
  Edit,
  Printer,
  CreditCard,
  User,
  Calendar,
  Building,
} from 'lucide-react';

const mockInvoice = {
  id: '1',
  number: 'INV-2024-001',
  date: '2024-01-18',
  dueDate: '2024-02-18',
  status: 'paid',
  patient: {
    id: '1',
    name: 'أحمد محمد علي',
    fileNumber: 'P-2024-001',
    phone: '+964 750 123 4567',
    email: 'ahmed@email.com',
    address: 'بغداد، الكرادة، شارع 52',
  },
  visit: {
    id: '1',
    date: '2024-01-18',
    doctor: 'د. سارة أحمد',
  },
  items: [
    {
      id: '1',
      description: 'فحص عام',
      quantity: 1,
      unitPrice: 25000,
      total: 25000,
    },
    {
      id: '2',
      description: 'علاج عصب',
      quantity: 1,
      unitPrice: 150000,
      total: 150000,
    },
    {
      id: '3',
      description: 'حشوة دائمة',
      quantity: 1,
      unitPrice: 50000,
      total: 50000,
    },
    {
      id: '4',
      description: 'أشعة سينية',
      quantity: 2,
      unitPrice: 12500,
      total: 25000,
    },
  ],
  subtotal: 250000,
  discount: {
    type: 'percentage',
    value: 0,
    amount: 0,
    reason: '',
  },
  tax: 0,
  total: 250000,
  payments: [
    {
      id: '1',
      date: '2024-01-18',
      amount: 250000,
      method: 'CASH',
      reference: '',
      receivedBy: 'محمد المحاسب',
    },
  ],
  paid: 250000,
  balance: 0,
  notes: 'تم الدفع نقداً',
  createdBy: 'محمد المحاسب',
  createdAt: '2024-01-18T11:30:00',
};

const paymentMethodLabels: Record<string, string> = {
  CASH: 'نقدي',
  CARD: 'بطاقة',
  BANK_TRANSFER: 'تحويل بنكي',
  OTHER: 'أخرى',
};

export default function InvoiceDetailPage() {
  const params = useParams();
  const t = useTranslations();
  const invoice = mockInvoice;

  const statusVariant = {
    draft: 'secondary' as const,
    pending: 'warning' as const,
    partial: 'info' as const,
    paid: 'success' as const,
    cancelled: 'destructive' as const,
    refunded: 'destructive' as const,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/finance/invoices">
            <ArrowLeft className="h-5 w-5 rtl:rotate-180" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">
            {t('finance.invoice')} #{invoice.number}
          </h1>
          <p className="text-muted-foreground">
            {invoice.date} - {invoice.patient.name}
          </p>
        </div>
        <div className="flex gap-2">
          {(invoice.status === 'pending' || invoice.status === 'partial') && (
            <Button asChild>
              <Link href={`/finance/invoices/${params.id as string}/payment`}>
                <CreditCard className="me-2 h-4 w-4" />
                {t('finance.addPayment')}
              </Link>
            </Button>
          )}
          <Button variant="outline" asChild>
            <Link href={`/finance/invoices/${params.id as string}/edit`}>
              <Edit className="me-2 h-4 w-4" />
              {t('common.edit')}
            </Link>
          </Button>
          <Button variant="outline">
            <Printer className="me-2 h-4 w-4" />
            {t('common.print')}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Invoice Header */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <Building className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">MyClinic</h2>
                    <p className="text-muted-foreground">عيادة أسنان متخصصة</p>
                    <p className="text-sm text-muted-foreground">بغداد، العراق</p>
                  </div>
                </div>
                <div className="text-end">
                  <Badge variant={statusVariant[invoice.status as keyof typeof statusVariant]} className="mb-2">
                    {t(`finance.status.${invoice.status}`)}
                  </Badge>
                  <p className="text-2xl font-bold">{invoice.number}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Invoice Details */}
          <Card>
            <CardHeader>
              <CardTitle>{t('finance.invoiceDetails')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground">{t('finance.billTo')}</p>
                    <p className="font-medium">{invoice.patient.name}</p>
                    <p className="text-sm text-muted-foreground">{invoice.patient.fileNumber}</p>
                    <p className="text-sm text-muted-foreground" dir="ltr">{invoice.patient.phone}</p>
                    {invoice.patient.address && (
                      <p className="text-sm text-muted-foreground">{invoice.patient.address}</p>
                    )}
                  </div>
                </div>
                <div className="space-y-4 md:text-end">
                  <div className="flex justify-between md:justify-end md:gap-8">
                    <p className="text-sm text-muted-foreground">{t('finance.invoiceDate')}:</p>
                    <p className="font-medium">{invoice.date}</p>
                  </div>
                  <div className="flex justify-between md:justify-end md:gap-8">
                    <p className="text-sm text-muted-foreground">{t('finance.dueDate')}:</p>
                    <p className="font-medium">{invoice.dueDate}</p>
                  </div>
                  {invoice.visit && (
                    <div className="flex justify-between md:justify-end md:gap-8">
                      <p className="text-sm text-muted-foreground">{t('visits.title')}:</p>
                      <Link href={`/visits/${invoice.visit.id}`} className="font-medium text-primary hover:underline">
                        {invoice.visit.date}
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Line Items */}
          <Card>
            <CardHeader>
              <CardTitle>{t('finance.items')}</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50%]">{t('finance.description')}</TableHead>
                    <TableHead className="text-center">{t('finance.quantity')}</TableHead>
                    <TableHead className="text-end">{t('finance.unitPrice')}</TableHead>
                    <TableHead className="text-end">{t('finance.total')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoice.items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.description}</TableCell>
                      <TableCell className="text-center">{item.quantity}</TableCell>
                      <TableCell className="text-end">{item.unitPrice.toLocaleString()}</TableCell>
                      <TableCell className="text-end">{item.total.toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                <TableFooter>
                  <TableRow>
                    <TableCell colSpan={3} className="text-end">{t('finance.subtotal')}</TableCell>
                    <TableCell className="text-end">{invoice.subtotal.toLocaleString()} IQD</TableCell>
                  </TableRow>
                  {invoice.discount.amount > 0 && (
                    <TableRow>
                      <TableCell colSpan={3} className="text-end">
                        {t('finance.discount')}
                        {invoice.discount.reason && ` (${invoice.discount.reason})`}
                      </TableCell>
                      <TableCell className="text-end text-destructive">
                        -{invoice.discount.amount.toLocaleString()} IQD
                      </TableCell>
                    </TableRow>
                  )}
                  {invoice.tax > 0 && (
                    <TableRow>
                      <TableCell colSpan={3} className="text-end">{t('finance.tax')}</TableCell>
                      <TableCell className="text-end">{invoice.tax.toLocaleString()} IQD</TableCell>
                    </TableRow>
                  )}
                  <TableRow>
                    <TableCell colSpan={3} className="text-end font-bold">{t('finance.total')}</TableCell>
                    <TableCell className="text-end font-bold text-lg">{invoice.total.toLocaleString()} IQD</TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
            </CardContent>
          </Card>

          {/* Payments */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{t('finance.payments')}</CardTitle>
                {(invoice.status === 'pending' || invoice.status === 'partial') && (
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/finance/invoices/${params.id as string}/payment`}>
                      <CreditCard className="me-2 h-4 w-4" />
                      {t('finance.addPayment')}
                    </Link>
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {invoice.payments.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('common.date')}</TableHead>
                      <TableHead>{t('finance.amount')}</TableHead>
                      <TableHead>{t('finance.paymentMethod')}</TableHead>
                      <TableHead>{t('finance.receivedBy')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoice.payments.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell>{payment.date}</TableCell>
                        <TableCell>{payment.amount.toLocaleString()} IQD</TableCell>
                        <TableCell>{paymentMethodLabels[payment.method]}</TableCell>
                        <TableCell>{payment.receivedBy}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-muted-foreground text-center py-4">{t('finance.noPayments')}</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Summary */}
          <Card>
            <CardHeader>
              <CardTitle>{t('finance.summary')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('finance.total')}</span>
                <span className="font-medium">{invoice.total.toLocaleString()} IQD</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('finance.paidAmount')}</span>
                <span className="font-medium text-green-600">{invoice.paid.toLocaleString()} IQD</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="font-medium">{t('finance.balance')}</span>
                <span className={`font-bold text-lg ${invoice.balance > 0 ? 'text-destructive' : 'text-green-600'}`}>
                  {invoice.balance.toLocaleString()} IQD
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Patient Info */}
          <Card>
            <CardHeader>
              <CardTitle>{t('patients.patientInfo')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <User className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="font-medium">{invoice.patient.name}</p>
                  <p className="text-sm text-muted-foreground">{invoice.patient.fileNumber}</p>
                </div>
              </div>
              <Button variant="outline" className="w-full" asChild>
                <Link href={`/patients/${invoice.patient.id}`}>
                  {t('patients.viewProfile')}
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Notes */}
          {invoice.notes && (
            <Card>
              <CardHeader>
                <CardTitle>{t('common.notes')}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{invoice.notes}</p>
              </CardContent>
            </Card>
          )}

          {/* Meta */}
          <Card>
            <CardHeader>
              <CardTitle>{t('common.details')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">{t('common.createdAt')}</p>
                  <p className="font-medium">{new Date(invoice.createdAt).toLocaleString('ar-IQ')}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <User className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">{t('common.createdBy')}</p>
                  <p className="font-medium">{invoice.createdBy}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
