'use client';

import * as React from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
  Phone,
  Calendar,
  FileText,
  AlertCircle,
} from 'lucide-react';
import { usePatients } from '@/hooks/use-patients';
import { useDebouncedValue } from '@/hooks/use-debounced-value';

export default function PatientsPage() {
  const t = useTranslations();
  const [searchQuery, setSearchQuery] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<string>('all');
  const [page, setPage] = React.useState(1);

  const debouncedSearch = useDebouncedValue(searchQuery, 300);

  const { data, isLoading, isError, error } = usePatients({
    page,
    limit: 20,
    search: debouncedSearch || undefined,
    status: statusFilter !== 'all' ? (statusFilter as 'active' | 'inactive') : undefined,
  });

  const patients = data?.data ?? [];
  const totalPatients = data?.meta?.total ?? 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {t('patients.title')}
          </h1>
          <p className="text-muted-foreground">
            {isLoading ? (
              <Skeleton className="h-4 w-24 inline-block" />
            ) : (
              `${totalPatients} ${t('patients.title').toLowerCase()}`
            )}
          </p>
        </div>
        <Button asChild>
          <Link href="/patients/new">
            <Plus className="me-2 h-4 w-4" />
            {t('patients.newPatient')}
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={t('patients.searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
                className="ps-10"
              />
            </div>
            <Select
              value={statusFilter}
              onValueChange={(value) => {
                setStatusFilter(value);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder={t('common.status')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('common.all') || 'All'}</SelectItem>
                <SelectItem value="active">{t('common.active') || 'Active'}</SelectItem>
                <SelectItem value="inactive">{t('common.inactive') || 'Inactive'}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Error State */}
      {isError && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              <span>
                {(error as any)?.message || t('common.errorLoading') || 'Error loading data'}
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Patients Table */}
      <Card>
        <CardHeader>
          <CardTitle>{t('patients.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-12 w-24" />
                  <Skeleton className="h-12 flex-1" />
                  <Skeleton className="h-12 w-32" />
                  <Skeleton className="h-12 w-20" />
                  <Skeleton className="h-12 w-24" />
                  <Skeleton className="h-12 w-20" />
                  <Skeleton className="h-12 w-10" />
                </div>
              ))}
            </div>
          ) : patients.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              {searchQuery || statusFilter !== 'all'
                ? t('common.noResults') || 'No results found'
                : t('patients.noPatients') || 'No patients yet'}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('patients.fileNumber')}</TableHead>
                  <TableHead>{t('patients.patientName')}</TableHead>
                  <TableHead>{t('common.phone')}</TableHead>
                  <TableHead>{t('patients.gender')}</TableHead>
                  <TableHead>{t('common.date')}</TableHead>
                  <TableHead>{t('common.status')}</TableHead>
                  <TableHead className="w-[70px]">{t('common.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {patients.map((patient) => (
                  <TableRow key={patient.id}>
                    <TableCell className="font-medium">
                      <Link
                        href={`/patients/${patient.id}`}
                        className="text-primary hover:underline"
                      >
                        {patient.fileNumber}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{patient.name}</p>
                        {patient.email && (
                          <p className="text-sm text-muted-foreground">
                            {patient.email}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell dir="ltr">{patient.phone}</TableCell>
                    <TableCell>
                      {patient.gender === 'MALE'
                        ? t('patients.male')
                        : t('patients.female')}
                    </TableCell>
                    <TableCell>
                      {patient.lastVisit ? (
                        <div className="text-sm">
                          <p>{patient.lastVisit}</p>
                          <p className="text-muted-foreground">
                            {patient.totalVisits} {t('visits.title').toLowerCase()}
                          </p>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={patient.status === 'active' ? 'success' : 'secondary'}
                      >
                        {patient.status === 'active' ? t('common.active') || 'Active' : t('common.inactive') || 'Inactive'}
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
                            <Link href={`/patients/${patient.id}`}>
                              <Eye className="me-2 h-4 w-4" />
                              {t('common.view') || 'View'}
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/patients/${patient.id}/edit`}>
                              <Edit className="me-2 h-4 w-4" />
                              {t('common.edit')}
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Phone className="me-2 h-4 w-4" />
                            {t('common.call') || 'Call'}
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/appointments/new?patientId=${patient.id}`}>
                              <Calendar className="me-2 h-4 w-4" />
                              {t('appointments.newAppointment')}
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/invoices/new?patientId=${patient.id}`}>
                              <FileText className="me-2 h-4 w-4" />
                              {t('finance.newInvoice')}
                            </Link>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {data?.meta && data.meta.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {t('common.showing') || 'Showing'} {((page - 1) * 20) + 1}-
            {Math.min(page * 20, totalPatients)} {t('common.of') || 'of'} {totalPatients}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
            >
              {t('common.previous') || 'Previous'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= data.meta.totalPages}
              onClick={() => setPage(page + 1)}
            >
              {t('common.next') || 'Next'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
