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
} from 'lucide-react';

interface InventoryItem {
  id: string;
  sku: string;
  name: string;
  category?: { id: string; name: string };
  supplier?: { id: string; name: string };
  unit: string;
  quantityInStock: number;
  reorderPoint: number;
  costPrice?: number;
  sellingPrice?: number;
  expiryDate?: string;
  active: boolean;
}

// Mock data for development
const mockItems: InventoryItem[] = [
  {
    id: '1',
    sku: 'MED-001',
    name: 'Paracetamol 500mg',
    category: { id: '1', name: 'Medications' },
    supplier: { id: '1', name: 'PharmaCo Ltd' },
    unit: 'BOXES',
    quantityInStock: 150,
    reorderPoint: 50,
    costPrice: 5.00,
    sellingPrice: 8.00,
    expiryDate: '2025-12-31',
    active: true,
  },
  {
    id: '2',
    sku: 'MED-002',
    name: 'Ibuprofen 400mg',
    category: { id: '1', name: 'Medications' },
    supplier: { id: '1', name: 'PharmaCo Ltd' },
    unit: 'BOXES',
    quantityInStock: 30,
    reorderPoint: 50,
    costPrice: 6.00,
    sellingPrice: 10.00,
    expiryDate: '2025-06-30',
    active: true,
  },
  {
    id: '3',
    sku: 'SUP-001',
    name: 'Surgical Gloves (M)',
    category: { id: '2', name: 'Supplies' },
    supplier: { id: '2', name: 'MedSupply Inc' },
    unit: 'BOXES',
    quantityInStock: 200,
    reorderPoint: 100,
    costPrice: 15.00,
    sellingPrice: 20.00,
    active: true,
  },
  {
    id: '4',
    sku: 'SUP-002',
    name: 'Syringes 5ml',
    category: { id: '2', name: 'Supplies' },
    supplier: { id: '2', name: 'MedSupply Inc' },
    unit: 'PIECES',
    quantityInStock: 0,
    reorderPoint: 200,
    costPrice: 0.50,
    sellingPrice: 1.00,
    active: true,
  },
  {
    id: '5',
    sku: 'EQP-001',
    name: 'Blood Pressure Monitor',
    category: { id: '3', name: 'Equipment' },
    supplier: { id: '3', name: 'HealthTech' },
    unit: 'PIECES',
    quantityInStock: 5,
    reorderPoint: 2,
    costPrice: 150.00,
    sellingPrice: 200.00,
    active: true,
  },
];

export default function InventoryPage() {
  const t = useTranslations();
  const [searchQuery, setSearchQuery] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<string>('all');
  const [stockFilter, setStockFilter] = React.useState<string>('all');

  const filteredItems = mockItems.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && item.active) ||
      (statusFilter === 'inactive' && !item.active);
    const matchesStock =
      stockFilter === 'all' ||
      (stockFilter === 'low' && item.quantityInStock <= item.reorderPoint && item.quantityInStock > 0) ||
      (stockFilter === 'out' && item.quantityInStock === 0);
    return matchesSearch && matchesStatus && matchesStock;
  });

  const stats = {
    totalItems: mockItems.length,
    lowStock: mockItems.filter(i => i.quantityInStock <= i.reorderPoint && i.quantityInStock > 0).length,
    outOfStock: mockItems.filter(i => i.quantityInStock === 0).length,
    totalValue: mockItems.reduce((sum, i) => sum + (i.quantityInStock * (i.costPrice || 0)), 0),
  };

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
                <p className="text-2xl font-bold">{stats.totalItems}</p>
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
                <p className="text-2xl font-bold">{stats.lowStock}</p>
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
                <p className="text-2xl font-bold">{stats.outOfStock}</p>
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
                <p className="text-2xl font-bold">${stats.totalValue.toFixed(2)}</p>
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

      {/* Items Table */}
      <Card>
        <CardHeader>
          <CardTitle>{t('inventory.items') || 'Items'}</CardTitle>
        </CardHeader>
        <CardContent>
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
              {filteredItems.map((item) => {
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
        </CardContent>
      </Card>
    </div>
  );
}
