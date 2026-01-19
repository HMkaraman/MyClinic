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
  Package,
  AlertTriangle,
  TrendingDown,
  Boxes,
  AlertCircle,
} from 'lucide-react';
import { useInventoryItems, useLowStockItems, type InventoryItem } from '@/hooks/use-inventory';
import { useDebouncedValue } from '@/hooks/use-debounced-value';

export default function InventoryPage() {
  const t = useTranslations();
  const [searchQuery, setSearchQuery] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<string>('all');
  const [stockFilter, setStockFilter] = React.useState<string>('all');

  const debouncedSearch = useDebouncedValue(searchQuery, 300);

  const buildParams = () => {
    const params: Record<string, string> = {};
    if (debouncedSearch) params.search = debouncedSearch;
    if (statusFilter !== 'all') params.active = statusFilter === 'active' ? 'true' : 'false';
    if (stockFilter === 'low') params.lowStock = 'true';
    if (stockFilter === 'out') params.outOfStock = 'true';
    return params;
  };

  const { data, isLoading, isError, error } = useInventoryItems(buildParams());
  const { data: lowStockData } = useLowStockItems();

  const items = data?.data ?? [];
  const totalItems = data?.meta?.total ?? items.length;

  // Calculate stats
  const stats = React.useMemo(() => {
    return {
      totalItems,
      lowStock: lowStockData?.data?.filter(i => i.quantityInStock > 0).length ?? 0,
      outOfStock: items.filter(i => i.quantityInStock === 0).length,
      totalValue: items.reduce((sum, i) => sum + (i.quantityInStock * (i.costPrice || 0)), 0),
    };
  }, [items, totalItems, lowStockData]);

  const getStockStatus = (item: InventoryItem) => {
    if (item.quantityInStock === 0) return 'out';
    if (item.quantityInStock <= item.reorderPoint) return 'low';
    return 'ok';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {t('inventory.title') || 'Inventory'}
          </h1>
          <p className="text-muted-foreground">
            {t('inventory.description') || 'Manage your stock and supplies'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/inventory/categories">
              <Boxes className="me-2 h-4 w-4" />
              {t('inventory.categories') || 'Categories'}
            </Link>
          </Button>
          <Button asChild>
            <Link href="/inventory/new">
              <Plus className="me-2 h-4 w-4" />
              {t('inventory.newItem') || 'New Item'}
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="rounded-full bg-primary/10 p-3">
                <Package className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('inventory.totalItems') || 'Total Items'}</p>
                {isLoading ? (
                  <Skeleton className="h-8 w-12" />
                ) : (
                  <p className="text-2xl font-bold">{stats.totalItems}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="rounded-full bg-warning/10 p-3">
                <AlertTriangle className="h-6 w-6 text-warning" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('inventory.lowStock') || 'Low Stock'}</p>
                {isLoading ? (
                  <Skeleton className="h-8 w-12" />
                ) : (
                  <p className="text-2xl font-bold">{stats.lowStock}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="rounded-full bg-destructive/10 p-3">
                <TrendingDown className="h-6 w-6 text-destructive" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('inventory.outOfStock') || 'Out of Stock'}</p>
                {isLoading ? (
                  <Skeleton className="h-8 w-12" />
                ) : (
                  <p className="text-2xl font-bold">{stats.outOfStock}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="rounded-full bg-success/10 p-3">
                <Package className="h-6 w-6 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('inventory.totalValue') || 'Total Value'}</p>
                {isLoading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <p className="text-2xl font-bold">${stats.totalValue.toFixed(2)}</p>
                )}
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
                placeholder={t('inventory.searchPlaceholder') || 'Search by name or SKU...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="ps-10"
              />
            </div>
            <Select value={stockFilter} onValueChange={setStockFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder={t('inventory.stockLevel') || 'Stock Level'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('common.all') || 'All'}</SelectItem>
                <SelectItem value="low">{t('inventory.lowStock') || 'Low Stock'}</SelectItem>
                <SelectItem value="out">{t('inventory.outOfStock') || 'Out of Stock'}</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder={t('common.status') || 'Status'} />
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

      {/* Items Table */}
      <Card>
        <CardHeader>
          <CardTitle>{t('inventory.items') || 'Items'}</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-12 w-20" />
                  <Skeleton className="h-12 flex-1" />
                  <Skeleton className="h-12 w-24" />
                  <Skeleton className="h-12 w-16" />
                  <Skeleton className="h-12 w-16" />
                  <Skeleton className="h-12 w-20" />
                  <Skeleton className="h-12 w-20" />
                  <Skeleton className="h-12 w-10" />
                </div>
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              {t('inventory.noItems') || 'No items found'}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('inventory.sku') || 'SKU'}</TableHead>
                  <TableHead>{t('inventory.itemName') || 'Name'}</TableHead>
                  <TableHead>{t('inventory.category') || 'Category'}</TableHead>
                  <TableHead>{t('inventory.quantity') || 'Quantity'}</TableHead>
                  <TableHead>{t('inventory.unit') || 'Unit'}</TableHead>
                  <TableHead>{t('inventory.price') || 'Price'}</TableHead>
                  <TableHead>{t('common.status') || 'Status'}</TableHead>
                  <TableHead className="w-[70px]">{t('common.actions') || 'Actions'}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => {
                  const stockStatus = getStockStatus(item);
                  return (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">
                        <Link
                          href={`/inventory/${item.id}`}
                          className="text-primary hover:underline"
                        >
                          {item.sku}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{item.name}</p>
                          {item.supplier && (
                            <p className="text-sm text-muted-foreground">
                              {item.supplier.name}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{item.category?.name || '-'}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className={stockStatus === 'out' ? 'text-destructive font-medium' : stockStatus === 'low' ? 'text-warning font-medium' : ''}>
                            {item.quantityInStock}
                          </span>
                          {stockStatus === 'low' && (
                            <AlertTriangle className="h-4 w-4 text-warning" />
                          )}
                          {stockStatus === 'out' && (
                            <TrendingDown className="h-4 w-4 text-destructive" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{item.unit}</TableCell>
                      <TableCell>
                        {item.sellingPrice ? `$${item.sellingPrice.toFixed(2)}` : '-'}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            stockStatus === 'out'
                              ? 'destructive'
                              : stockStatus === 'low'
                              ? 'warning'
                              : 'success'
                          }
                        >
                          {stockStatus === 'out'
                            ? t('inventory.outOfStock') || 'Out of Stock'
                            : stockStatus === 'low'
                            ? t('inventory.lowStock') || 'Low Stock'
                            : t('inventory.inStock') || 'In Stock'}
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
                              <Link href={`/inventory/${item.id}`}>
                                <Eye className="me-2 h-4 w-4" />
                                {t('common.view') || 'View'}
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href={`/inventory/${item.id}/edit`}>
                                <Edit className="me-2 h-4 w-4" />
                                {t('common.edit') || 'Edit'}
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href={`/inventory/${item.id}?adjust=true`}>
                                <Package className="me-2 h-4 w-4" />
                                {t('inventory.adjustStock') || 'Adjust Stock'}
                              </Link>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
