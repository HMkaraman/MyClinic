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
  ArrowLeft,
  ShoppingCart,
  CheckCircle,
  XCircle,
  Package,
  Clock,
  Truck,
} from 'lucide-react';

type OrderStatus = 'DRAFT' | 'APPROVED' | 'ORDERED' | 'PARTIALLY_RECEIVED' | 'RECEIVED' | 'CANCELLED';

interface PurchaseOrder {
  id: string;
  orderNumber: string;
  supplier: { id: string; name: string };
  status: OrderStatus;
  orderDate: string;
  expectedDate?: string;
  total: number;
  itemCount: number;
}

// Mock data
const mockOrders: PurchaseOrder[] = [
  {
    id: '1',
    orderNumber: 'PO-2024-001',
    supplier: { id: '1', name: 'PharmaCo Ltd' },
    status: 'RECEIVED',
    orderDate: '2024-01-10',
    expectedDate: '2024-01-15',
    total: 2500.00,
    itemCount: 5,
  },
  {
    id: '2',
    orderNumber: 'PO-2024-002',
    supplier: { id: '2', name: 'MedSupply Inc' },
    status: 'ORDERED',
    orderDate: '2024-01-12',
    expectedDate: '2024-01-20',
    total: 1800.00,
    itemCount: 8,
  },
  {
    id: '3',
    orderNumber: 'PO-2024-003',
    supplier: { id: '1', name: 'PharmaCo Ltd' },
    status: 'PARTIALLY_RECEIVED',
    orderDate: '2024-01-14',
    expectedDate: '2024-01-22',
    total: 3200.00,
    itemCount: 12,
  },
  {
    id: '4',
    orderNumber: 'PO-2024-004',
    supplier: { id: '3', name: 'HealthTech' },
    status: 'APPROVED',
    orderDate: '2024-01-15',
    expectedDate: '2024-01-25',
    total: 4500.00,
    itemCount: 3,
  },
  {
    id: '5',
    orderNumber: 'PO-2024-005',
    supplier: { id: '2', name: 'MedSupply Inc' },
    status: 'DRAFT',
    orderDate: '2024-01-16',
    total: 950.00,
    itemCount: 4,
  },
  {
    id: '6',
    orderNumber: 'PO-2024-006',
    supplier: { id: '1', name: 'PharmaCo Ltd' },
    status: 'CANCELLED',
    orderDate: '2024-01-08',
    total: 1200.00,
    itemCount: 6,
  },
];

const statusConfig: Record<OrderStatus, { label: string; variant: 'default' | 'secondary' | 'success' | 'warning' | 'destructive' | 'info'; icon: React.ReactNode }> = {
  DRAFT: { label: 'Draft', variant: 'secondary', icon: <Edit className="h-3 w-3" /> },
  APPROVED: { label: 'Approved', variant: 'info', icon: <CheckCircle className="h-3 w-3" /> },
  ORDERED: { label: 'Ordered', variant: 'warning', icon: <Clock className="h-3 w-3" /> },
  PARTIALLY_RECEIVED: { label: 'Partial', variant: 'warning', icon: <Truck className="h-3 w-3" /> },
  RECEIVED: { label: 'Received', variant: 'success', icon: <Package className="h-3 w-3" /> },
  CANCELLED: { label: 'Cancelled', variant: 'destructive', icon: <XCircle className="h-3 w-3" /> },
};

export default function PurchaseOrdersPage() {
  const t = useTranslations();
  const [searchQuery, setSearchQuery] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<string>('all');

  const filteredOrders = mockOrders.filter((order) => {
    const matchesSearch =
      order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.supplier.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: mockOrders.length,
    pending: mockOrders.filter(o => ['DRAFT', 'APPROVED', 'ORDERED'].includes(o.status)).length,
    inTransit: mockOrders.filter(o => ['ORDERED', 'PARTIALLY_RECEIVED'].includes(o.status)).length,
    received: mockOrders.filter(o => o.status === 'RECEIVED').length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/inventory">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {t('inventory.purchaseOrders') || 'Purchase Orders'}
            </h1>
            <p className="text-muted-foreground">
              {t('inventory.purchaseOrdersDescription') || 'Manage inventory purchase orders'}
            </p>
          </div>
        </div>
        <Button asChild>
          <Link href="/inventory/purchase-orders/new">
            <Plus className="me-2 h-4 w-4" />
            {t('inventory.newPurchaseOrder') || 'New Order'}
          </Link>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="rounded-full bg-primary/10 p-3">
                <ShoppingCart className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('inventory.totalOrders') || 'Total Orders'}</p>
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
                <p className="text-sm text-muted-foreground">{t('inventory.pendingOrders') || 'Pending'}</p>
                <p className="text-2xl font-bold">{stats.pending}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="rounded-full bg-info/10 p-3">
                <Truck className="h-6 w-6 text-info" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('inventory.inTransit') || 'In Transit'}</p>
                <p className="text-2xl font-bold">{stats.inTransit}</p>
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
                <p className="text-sm text-muted-foreground">{t('inventory.received') || 'Received'}</p>
                <p className="text-2xl font-bold">{stats.received}</p>
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
                placeholder={t('inventory.searchOrders') || 'Search by order number or supplier...'}
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
                <SelectItem value="DRAFT">{t('inventory.draft') || 'Draft'}</SelectItem>
                <SelectItem value="APPROVED">{t('inventory.approved') || 'Approved'}</SelectItem>
                <SelectItem value="ORDERED">{t('inventory.ordered') || 'Ordered'}</SelectItem>
                <SelectItem value="PARTIALLY_RECEIVED">{t('inventory.partiallyReceived') || 'Partial'}</SelectItem>
                <SelectItem value="RECEIVED">{t('inventory.received') || 'Received'}</SelectItem>
                <SelectItem value="CANCELLED">{t('inventory.cancelled') || 'Cancelled'}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            {t('inventory.allOrders') || 'All Orders'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('inventory.orderNumber') || 'Order #'}</TableHead>
                <TableHead>{t('inventory.supplier') || 'Supplier'}</TableHead>
                <TableHead>{t('inventory.orderDate') || 'Order Date'}</TableHead>
                <TableHead>{t('inventory.expectedDate') || 'Expected'}</TableHead>
                <TableHead>{t('inventory.items') || 'Items'}</TableHead>
                <TableHead>{t('inventory.total') || 'Total'}</TableHead>
                <TableHead>{t('common.status') || 'Status'}</TableHead>
                <TableHead className="w-[70px]">{t('common.actions') || 'Actions'}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.map((order) => {
                const config = statusConfig[order.status];
                return (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">
                      <Link
                        href={`/inventory/purchase-orders/${order.id}`}
                        className="text-primary hover:underline"
                      >
                        {order.orderNumber}
                      </Link>
                    </TableCell>
                    <TableCell>{order.supplier.name}</TableCell>
                    <TableCell>{order.orderDate}</TableCell>
                    <TableCell>{order.expectedDate || '-'}</TableCell>
                    <TableCell>{order.itemCount} items</TableCell>
                    <TableCell>${order.total.toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge variant={config.variant} className="flex w-fit items-center gap-1">
                        {config.icon}
                        {config.label}
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
                            <Link href={`/inventory/purchase-orders/${order.id}`}>
                              <Eye className="me-2 h-4 w-4" />
                              {t('common.view') || 'View'}
                            </Link>
                          </DropdownMenuItem>
                          {order.status === 'DRAFT' && (
                            <>
                              <DropdownMenuItem asChild>
                                <Link href={`/inventory/purchase-orders/${order.id}/edit`}>
                                  <Edit className="me-2 h-4 w-4" />
                                  {t('common.edit') || 'Edit'}
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem>
                                <CheckCircle className="me-2 h-4 w-4" />
                                {t('inventory.approve') || 'Approve'}
                              </DropdownMenuItem>
                            </>
                          )}
                          {['ORDERED', 'PARTIALLY_RECEIVED'].includes(order.status) && (
                            <DropdownMenuItem>
                              <Package className="me-2 h-4 w-4" />
                              {t('inventory.receiveItems') || 'Receive Items'}
                            </DropdownMenuItem>
                          )}
                          {['DRAFT', 'APPROVED'].includes(order.status) && (
                            <DropdownMenuItem className="text-destructive">
                              <XCircle className="me-2 h-4 w-4" />
                              {t('inventory.cancel') || 'Cancel'}
                            </DropdownMenuItem>
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
