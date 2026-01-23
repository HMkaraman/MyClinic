'use client';

import * as React from 'react';
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
  Edit,
  AlertCircle,
  UserCheck,
  UserX,
} from 'lucide-react';
import { usersApi, type User, type UserRole, type UserStatus } from '@/lib/users-api';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { useAuthStore } from '@/stores/auth-store';
import { StaffFormDialog } from '@/components/staff/staff-form-dialog';
import { useToast } from '@/hooks/use-toast';

const STAFF_ROLES: UserRole[] = ['ADMIN', 'MANAGER', 'DOCTOR', 'NURSE', 'RECEPTION', 'ACCOUNTANT', 'SUPPORT'];
const STATUSES: UserStatus[] = ['ACTIVE', 'INACTIVE', 'SUSPENDED'];

export default function StaffPage() {
  const t = useTranslations();
  const { toast } = useToast();
  const { user: currentUser } = useAuthStore();
  const isAdmin = currentUser?.role === 'ADMIN';

  const [searchQuery, setSearchQuery] = React.useState('');
  const [roleFilter, setRoleFilter] = React.useState<string>('all');
  const [statusFilter, setStatusFilter] = React.useState<string>('all');
  const [page, setPage] = React.useState(1);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isError, setIsError] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);
  const [users, setUsers] = React.useState<User[]>([]);
  const [totalUsers, setTotalUsers] = React.useState(0);
  const [totalPages, setTotalPages] = React.useState(1);

  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [dialogMode, setDialogMode] = React.useState<'create' | 'edit'>('create');
  const [selectedStaff, setSelectedStaff] = React.useState<User | null>(null);

  const debouncedSearch = useDebouncedValue(searchQuery, 300);

  const fetchUsers = React.useCallback(async () => {
    setIsLoading(true);
    setIsError(false);
    try {
      const response = await usersApi.getUsers({
        page,
        limit: 20,
        search: debouncedSearch || undefined,
        role: roleFilter !== 'all' ? (roleFilter as UserRole) : undefined,
        status: statusFilter !== 'all' ? (statusFilter as UserStatus) : undefined,
      });
      setUsers(response.data);
      setTotalUsers(response.meta?.total ?? 0);
      setTotalPages(response.meta?.totalPages ?? 1);
    } catch (err) {
      setIsError(true);
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [page, debouncedSearch, roleFilter, statusFilter]);

  React.useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleCreateClick = () => {
    setDialogMode('create');
    setSelectedStaff(null);
    setDialogOpen(true);
  };

  const handleEditClick = (staff: User) => {
    setDialogMode('edit');
    setSelectedStaff(staff);
    setDialogOpen(true);
  };

  const handleToggleStatus = async (staff: User) => {
    const newStatus = staff.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      await usersApi.updateUser(staff.id, { status: newStatus });
      toast({
        title: newStatus === 'ACTIVE'
          ? t('staff.activateSuccess')
          : t('staff.deactivateSuccess'),
      });
      fetchUsers();
    } catch (err) {
      console.error('Failed to update status:', err);
      toast({ title: t('common.error'), variant: 'destructive' });
    }
  };

  const getStatusBadgeVariant = (status: UserStatus) => {
    switch (status) {
      case 'ACTIVE':
        return 'success';
      case 'INACTIVE':
        return 'secondary';
      case 'SUSPENDED':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const getStatusLabel = (status: UserStatus) => {
    switch (status) {
      case 'ACTIVE':
        return t('common.active');
      case 'INACTIVE':
        return t('common.inactive');
      case 'SUSPENDED':
        return t('staff.suspended');
      default:
        return status;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {t('staff.title')}
          </h1>
          <div className="text-muted-foreground">
            {isLoading ? (
              <Skeleton className="h-4 w-24 inline-block" />
            ) : (
              t('staff.description')
            )}
          </div>
        </div>
        {isAdmin && (
          <Button onClick={handleCreateClick}>
            <Plus className="me-2 h-4 w-4" />
            {t('staff.addStaff')}
          </Button>
        )}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={t('staff.searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
                className="ps-10"
              />
            </div>
            <Select
              value={roleFilter}
              onValueChange={(value) => {
                setRoleFilter(value);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder={t('staff.filterByRole')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('staff.allRoles')}</SelectItem>
                {STAFF_ROLES.map((role) => (
                  <SelectItem key={role} value={role}>
                    {t(`roles.${role.toLowerCase()}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={statusFilter}
              onValueChange={(value) => {
                setStatusFilter(value);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder={t('staff.filterByStatus')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('staff.allStatuses')}</SelectItem>
                {STATUSES.map((status) => (
                  <SelectItem key={status} value={status}>
                    {getStatusLabel(status)}
                  </SelectItem>
                ))}
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
                {error?.message || t('common.errorLoading')}
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Staff Table */}
      <Card>
        <CardHeader>
          <CardTitle>{t('staff.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-12 flex-1" />
                  <Skeleton className="h-12 w-24" />
                  <Skeleton className="h-12 w-32" />
                  <Skeleton className="h-12 w-20" />
                  <Skeleton className="h-12 w-10" />
                </div>
              ))}
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              {searchQuery || roleFilter !== 'all' || statusFilter !== 'all'
                ? t('common.noResults')
                : t('staff.noStaffFound')}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('staff.name')}</TableHead>
                  <TableHead>{t('staff.role')}</TableHead>
                  <TableHead>{t('staff.branches')}</TableHead>
                  <TableHead>{t('staff.status')}</TableHead>
                  {isAdmin && (
                    <TableHead className="w-[70px]">{t('common.actions')}</TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((staff) => (
                  <TableRow key={staff.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{staff.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {staff.email}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {t(`roles.${staff.role.toLowerCase()}`)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {staff.branches && staff.branches.length > 0 ? (
                        <span className="text-sm">
                          {staff.branches.map((b) => b.name).join(', ')}
                        </span>
                      ) : (
                        <span className="text-sm text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(staff.status)}>
                        {getStatusLabel(staff.status)}
                      </Badge>
                    </TableCell>
                    {isAdmin && (
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEditClick(staff)}>
                              <Edit className="me-2 h-4 w-4" />
                              {t('staff.edit')}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleToggleStatus(staff)}>
                              {staff.status === 'ACTIVE' ? (
                                <>
                                  <UserX className="me-2 h-4 w-4" />
                                  {t('staff.deactivate')}
                                </>
                              ) : (
                                <>
                                  <UserCheck className="me-2 h-4 w-4" />
                                  {t('staff.activate')}
                                </>
                              )}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {t('common.showing')} {((page - 1) * 20) + 1}-
            {Math.min(page * 20, totalUsers)} {t('common.of')} {totalUsers}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
            >
              {t('common.previous')}
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
            >
              {t('common.next')}
            </Button>
          </div>
        </div>
      )}

      {/* Create/Edit Dialog */}
      <StaffFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        mode={dialogMode}
        staff={selectedStaff}
        onSuccess={fetchUsers}
      />
    </div>
  );
}
