'use client';

import * as React from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Plus,
  Search,
  MoreHorizontal,
  Eye,
  Edit,
  Printer,
  Receipt,
  DollarSign,
  CreditCard,
  AlertCircle,
} from 'lucide-react';

interface Invoice {
  id: string;
  number: string;
  patientName: string;
  patientFileNumber: string;
  date: string;
  dueDate: string;
  total: number;
  paid: number;
  status: 'draft' | 'pending' | 'partial' | 'paid' | 'cancelled' | 'refunded';
}

const mockInvoices: Invoice[] = [
  {
    id: '1',
    number: 'INV-2024-001',
    patientName: 'أحمد محمد علي',
    patientFileNumber: 'P-2024-001',
    date: '2024-01-18',
    dueDate: '2024-02-18',
    total: 250000,
    paid: 250000,
    status: 'paid',
  },
  {
    id: '2',
    number: 'INV-2024-002',
    patientName: 'فاطمة حسين',
    patientFileNumber: 'P-2024-002',
    date: '2024-01-17',
    dueDate: '2024-02-17',
    total: 150000,
    paid: 75000,
    status: 'partial',
  },
  {
    id: '3',
    number: 'INV-2024-003',
    patientName: 'محمود سعيد',
    patientFileNumber: 'P-2024-003',
    date: '2024-01-16',
    dueDate: '2024-02-16',
    total: 100000,
    paid: 0,
    status: 'pending',
  },
  {
    id: '4',
    number: 'INV-2024-004',
    patientName: 'نور الهدى',
    patientFileNumber: 'P-2024-004',
    date: '2024-01-15',
    dueDate: '2024-02-15',
    total: 300000,
    paid: 300000,
    status: 'paid',
  },
  {
    id: '5',
    number: 'INV-2024-005',
    patientName: 'علي كريم',
    patientFileNumber: 'P-2024-005',
    date: '2024-01-14',
    dueDate: '2024-02-14',
    total: 50000,
    paid: 0,
    status: 'draft',
  },
];

const statusConfig: Record<Invoice['status'], { variant: 'success' | 'warning' | 'destructive' | 'secondary' | 'info'; label: string }> = {
  draft: { variant: 'secondary', label: 'status.draft' },
  pending: { variant: 'warning', label: 'status.pending' },
  partial: { variant: 'info', label: 'status.partial' },
  paid: { variant: 'success', label: 'status.paid' },
  cancelled: { variant: 'destructive', label: 'status.cancelled' },
  refunded: { variant: 'destructive', label: 'status.refunded' },
};

export default function InvoicesPage() {
  const t = useTranslations();
  const [searchQuery, setSearchQuery] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<string>('all');

  const filteredInvoices = mockInvoices.filter((invoice) => {
    const matchesSearch =
      invoice.number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      invoice.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      invoice.patientFileNumber.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalRevenue = mockInvoices.reduce((sum, inv) => sum + inv.paid, 0);
  const pendingAmount = mockInvoices.reduce((sum, inv) => sum + (inv.total - inv.paid), 0);
  const paidCount = mockInvoices.filter((inv) => inv.status === 'paid').length;
  const pendingCount = mockInvoices.filter((inv) => inv.status === 'pending' || inv.status === 'partial').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {t('finance.invoices')}
          </h1>
          <p className="text-muted-foreground">
            {filteredInvoices.length} {t('finance.invoices').toLowerCase()}
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
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                <DollarSign className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalRevenue.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">{t('finance.totalRevenue')} (IQD)</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
                <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{pendingAmount.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">{t('finance.pendingAmount')} (IQD)</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <Receipt className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{paidCount}</p>
                <p className="text-sm text-muted-foreground">{t('finance.paidInvoices')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
                <CreditCard className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{pendingCount}</p>
                <p className="text-sm text-muted-foreground">{t('finance.pendingInvoices')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={t('finance.searchInvoices')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="ps-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder={t('common.status')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('inbox.all')}</SelectItem>
                <SelectItem value="draft">{t('finance.status.draft')}</SelectItem>
                <SelectItem value="pending">{t('finance.status.pending')}</SelectItem>
                <SelectItem value="partial">{t('finance.status.partial')}</SelectItem>
                <SelectItem value="paid">{t('finance.status.paid')}</SelectItem>
                <SelectItem value="cancelled">{t('finance.status.cancelled')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Invoices Table */}
      <Card>
        <CardHeader>
          <CardTitle>{t('finance.invoices')}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('finance.invoiceNumber')}</TableHead>
                <TableHead>{t('patients.patientName')}</TableHead>
                <TableHead>{t('common.date')}</TableHead>
                <TableHead>{t('finance.total')}</TableHead>
                <TableHead>{t('finance.paidAmount')}</TableHead>
                <TableHead>{t('finance.balance')}</TableHead>
                <TableHead>{t('common.status')}</TableHead>
                <TableHead className="w-[70px]">{t('common.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInvoices.map((invoice) => {
                const config = statusConfig[invoice.status];
                const balance = invoice.total - invoice.paid;
                return (
                  <TableRow key={invoice.id}>
                    <TableCell>
                      <Link
                        href={`/finance/invoices/${invoice.id}`}
                        className="text-primary hover:underline font-medium"
                      >
                        {invoice.number}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{invoice.patientName}</p>
                        <p className="text-sm text-muted-foreground">
                          {invoice.patientFileNumber}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>{invoice.date}</TableCell>
                    <TableCell>{invoice.total.toLocaleString()} IQD</TableCell>
                    <TableCell>{invoice.paid.toLocaleString()} IQD</TableCell>
                    <TableCell>
                      <span className={balance > 0 ? 'text-destructive' : ''}>
                        {balance.toLocaleString()} IQD
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={config.variant}>
                        {t(`finance.${config.label}`)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/finance/invoices/${invoice.id}`}>
                              <Eye className="me-2 h-4 w-4" />
                              {t('common.view') || 'View'}
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/finance/invoices/${invoice.id}/edit`}>
                              <Edit className="me-2 h-4 w-4" />
                              {t('common.edit')}
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Printer className="me-2 h-4 w-4" />
                            {t('common.print')}
                          </DropdownMenuItem>
                          {(invoice.status === 'pending' || invoice.status === 'partial') && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem asChild>
                                <Link href={`/finance/invoices/${invoice.id}/payment`}>
                                  <CreditCard className="me-2 h-4 w-4" />
                                  {t('finance.addPayment')}
                                </Link>
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
