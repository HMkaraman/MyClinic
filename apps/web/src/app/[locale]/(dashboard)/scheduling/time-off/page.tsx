'use client';

import * as React from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
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
  ArrowLeft,
  Plus,
  MoreHorizontal,
  CheckCircle,
  XCircle,
  Clock,
  CalendarOff,
  Search,
  Eye,
} from 'lucide-react';

type TimeOffType = 'VACATION' | 'SICK' | 'PERSONAL' | 'OTHER';
type TimeOffStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';

interface TimeOffRequest {
  id: string;
  user: {
    id: string;
    name: string;
    role: string;
  };
  type: TimeOffType;
  startDate: string;
  endDate: string;
  reason?: string;
  status: TimeOffStatus;
  approvedBy?: {
    id: string;
    name: string;
  };
  approvedAt?: string;
  rejectionReason?: string;
  createdAt: string;
}

// Mock data
const mockRequests: TimeOffRequest[] = [
  {
    id: '1',
    user: { id: '1', name: 'Dr. Ahmed Hassan', role: 'DOCTOR' },
    type: 'VACATION',
    startDate: '2024-02-01',
    endDate: '2024-02-07',
    reason: 'Family vacation',
    status: 'APPROVED',
    approvedBy: { id: '99', name: 'Admin' },
    approvedAt: '2024-01-20',
    createdAt: '2024-01-15',
  },
  {
    id: '2',
    user: { id: '2', name: 'Dr. Sara Mohamed', role: 'DOCTOR' },
    type: 'SICK',
    startDate: '2024-01-25',
    endDate: '2024-01-26',
    reason: 'Medical appointment',
    status: 'PENDING',
    createdAt: '2024-01-24',
  },
  {
    id: '3',
    user: { id: '3', name: 'Nurse Fatima', role: 'NURSE' },
    type: 'PERSONAL',
    startDate: '2024-01-28',
    endDate: '2024-01-28',
    reason: 'Personal matters',
    status: 'PENDING',
    createdAt: '2024-01-22',
  },
  {
    id: '4',
    user: { id: '4', name: 'Receptionist Ali', role: 'RECEPTION' },
    type: 'VACATION',
    startDate: '2024-01-10',
    endDate: '2024-01-12',
    reason: 'Travel',
    status: 'REJECTED',
    rejectionReason: 'Critical period - need coverage',
    createdAt: '2024-01-05',
  },
];

const mockStaff = [
  { id: '1', name: 'Dr. Ahmed Hassan', role: 'DOCTOR' },
  { id: '2', name: 'Dr. Sara Mohamed', role: 'DOCTOR' },
  { id: '3', name: 'Nurse Fatima', role: 'NURSE' },
  { id: '4', name: 'Receptionist Ali', role: 'RECEPTION' },
];

const typeConfig: Record<TimeOffType, { label: string; color: string }> = {
  VACATION: { label: 'Vacation', color: 'bg-blue-100 text-blue-800' },
  SICK: { label: 'Sick Leave', color: 'bg-orange-100 text-orange-800' },
  PERSONAL: { label: 'Personal', color: 'bg-purple-100 text-purple-800' },
  OTHER: { label: 'Other', color: 'bg-gray-100 text-gray-800' },
};

const statusConfig: Record<TimeOffStatus, { label: string; variant: 'default' | 'secondary' | 'success' | 'warning' | 'destructive'; icon: React.ReactNode }> = {
  PENDING: { label: 'Pending', variant: 'warning', icon: <Clock className="h-3 w-3" /> },
  APPROVED: { label: 'Approved', variant: 'success', icon: <CheckCircle className="h-3 w-3" /> },
  REJECTED: { label: 'Rejected', variant: 'destructive', icon: <XCircle className="h-3 w-3" /> },
  CANCELLED: { label: 'Cancelled', variant: 'secondary', icon: <XCircle className="h-3 w-3" /> },
};

export default function TimeOffRequestsPage() {
  const t = useTranslations();
  const [requests, setRequests] = React.useState(mockRequests);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<string>('all');
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [formData, setFormData] = React.useState({
    userId: '',
    type: 'VACATION' as TimeOffType,
    startDate: '',
    endDate: '',
    reason: '',
  });

  const filteredRequests = requests.filter((request) => {
    const matchesSearch = request.user.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || request.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: requests.length,
    pending: requests.filter((r) => r.status === 'PENDING').length,
    approved: requests.filter((r) => r.status === 'APPROVED').length,
    rejected: requests.filter((r) => r.status === 'REJECTED').length,
  };

  const handleSubmit = () => {
    const staff = mockStaff.find((s) => s.id === formData.userId);
    if (!staff) return;

    const newRequest: TimeOffRequest = {
      id: Date.now().toString(),
      user: staff,
      type: formData.type,
      startDate: formData.startDate,
      endDate: formData.endDate,
      reason: formData.reason,
      status: 'PENDING',
      createdAt: new Date().toISOString().split('T')[0] ?? '',
    };
    setRequests([newRequest, ...requests]);
    setIsDialogOpen(false);
    setFormData({
      userId: '',
      type: 'VACATION',
      startDate: '',
      endDate: '',
      reason: '',
    });
  };

  const handleApprove = (id: string) => {
    setRequests(
      requests.map((r) =>
        r.id === id
          ? {
              ...r,
              status: 'APPROVED' as TimeOffStatus,
              approvedBy: { id: '99', name: 'Admin' },
              approvedAt: new Date().toISOString().split('T')[0] ?? '',
            }
          : r
      )
    );
  };

  const handleReject = (id: string) => {
    setRequests(
      requests.map((r) =>
        r.id === id
          ? { ...r, status: 'REJECTED' as TimeOffStatus, rejectionReason: 'Request denied' }
          : r
      )
    );
  };

  const getDaysDiff = (start: string, end: string) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/scheduling">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {t('scheduling.timeOffRequests') || 'Time Off Requests'}
            </h1>
            <p className="text-muted-foreground">
              {t('scheduling.timeOffDescription') || 'Manage staff time off requests'}
            </p>
          </div>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="me-2 h-4 w-4" />
              {t('scheduling.newTimeOffRequest') || 'New Request'}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('scheduling.requestTimeOff') || 'Request Time Off'}</DialogTitle>
              <DialogDescription>
                {t('scheduling.requestTimeOffDescription') || 'Submit a new time off request'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid gap-2">
                <Label>{t('scheduling.staff') || 'Staff Member'}</Label>
                <Select
                  value={formData.userId}
                  onValueChange={(value) => setFormData({ ...formData, userId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('scheduling.selectStaff') || 'Select staff'} />
                  </SelectTrigger>
                  <SelectContent>
                    {mockStaff.map((staff) => (
                      <SelectItem key={staff.id} value={staff.id}>
                        {staff.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>{t('scheduling.type') || 'Type'}</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => setFormData({ ...formData, type: value as TimeOffType })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="VACATION">{t('scheduling.vacation') || 'Vacation'}</SelectItem>
                    <SelectItem value="SICK">{t('scheduling.sick') || 'Sick Leave'}</SelectItem>
                    <SelectItem value="PERSONAL">{t('scheduling.personal') || 'Personal'}</SelectItem>
                    <SelectItem value="OTHER">{t('scheduling.other') || 'Other'}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-2">
                  <Label>{t('scheduling.startDate') || 'Start Date'}</Label>
                  <Input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>{t('scheduling.endDate') || 'End Date'}</Label>
                  <Input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label>{t('scheduling.reason') || 'Reason'}</Label>
                <Textarea
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  placeholder={t('scheduling.enterReason') || 'Enter reason for time off...'}
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                {t('common.cancel') || 'Cancel'}
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!formData.userId || !formData.startDate || !formData.endDate}
              >
                {t('common.submit') || 'Submit'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="rounded-full bg-primary/10 p-3">
                <CalendarOff className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('common.total') || 'Total Requests'}</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="rounded-full bg-warning/10 p-3">
                <Clock className="h-6 w-6 text-warning" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('scheduling.status.pending') || 'Pending'}</p>
                <p className="text-2xl font-bold">{stats.pending}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="rounded-full bg-success/10 p-3">
                <CheckCircle className="h-6 w-6 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('scheduling.status.approved') || 'Approved'}</p>
                <p className="text-2xl font-bold">{stats.approved}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="rounded-full bg-destructive/10 p-3">
                <XCircle className="h-6 w-6 text-destructive" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('scheduling.status.rejected') || 'Rejected'}</p>
                <p className="text-2xl font-bold">{stats.rejected}</p>
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
                placeholder={t('scheduling.searchStaff') || 'Search by staff name...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="ps-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder={t('common.status') || 'Status'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('common.all') || 'All'}</SelectItem>
                <SelectItem value="PENDING">{t('scheduling.status.pending') || 'Pending'}</SelectItem>
                <SelectItem value="APPROVED">{t('scheduling.status.approved') || 'Approved'}</SelectItem>
                <SelectItem value="REJECTED">{t('scheduling.status.rejected') || 'Rejected'}</SelectItem>
                <SelectItem value="CANCELLED">{t('scheduling.status.cancelled') || 'Cancelled'}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Requests Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarOff className="h-5 w-5" />
            {t('scheduling.allRequests') || 'All Requests'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('scheduling.staff') || 'Staff'}</TableHead>
                <TableHead>{t('scheduling.type') || 'Type'}</TableHead>
                <TableHead>{t('scheduling.startDate') || 'Start'}</TableHead>
                <TableHead>{t('scheduling.endDate') || 'End'}</TableHead>
                <TableHead>{t('scheduling.duration') || 'Duration'}</TableHead>
                <TableHead>{t('common.status') || 'Status'}</TableHead>
                <TableHead className="w-[70px]">{t('common.actions') || 'Actions'}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRequests.map((request) => {
                const statusCfg = statusConfig[request.status];
                const typeCfg = typeConfig[request.type];
                const days = getDaysDiff(request.startDate, request.endDate);

                return (
                  <TableRow key={request.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{request.user.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {t(`roles.${request.user.role.toLowerCase()}`) || request.user.role}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs ${typeCfg.color}`}>
                        {t(`scheduling.${request.type.toLowerCase()}`) || typeCfg.label}
                      </span>
                    </TableCell>
                    <TableCell>{request.startDate}</TableCell>
                    <TableCell>{request.endDate}</TableCell>
                    <TableCell>
                      {days} {days === 1 ? t('common.day') || 'day' : t('common.days') || 'days'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusCfg.variant} className="flex w-fit items-center gap-1">
                        {statusCfg.icon}
                        {t(`scheduling.status.${request.status.toLowerCase()}`) || statusCfg.label}
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
                          <DropdownMenuItem>
                            <Eye className="me-2 h-4 w-4" />
                            {t('common.view') || 'View Details'}
                          </DropdownMenuItem>
                          {request.status === 'PENDING' && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleApprove(request.id)}>
                                <CheckCircle className="me-2 h-4 w-4" />
                                {t('scheduling.approve') || 'Approve'}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleReject(request.id)}
                                className="text-destructive"
                              >
                                <XCircle className="me-2 h-4 w-4" />
                                {t('scheduling.reject') || 'Reject'}
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
