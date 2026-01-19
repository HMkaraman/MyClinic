'use client';

import * as React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  ArrowLeft,
  Edit,
  Package,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  History,
  Plus,
  Minus,
} from 'lucide-react';

interface InventoryItem {
  id: string;
  sku: string;
  barcode?: string;
  name: string;
  description?: string;
  category?: { id: string; name: string };
  supplier?: { id: string; name: string };
  unit: string;
  quantityInStock: number;
  reorderPoint: number;
  reorderQuantity: number;
  costPrice?: number;
  sellingPrice?: number;
  expiryDate?: string;
  location?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Movement {
  id: string;
  type: string;
  quantity: number;
  quantityBefore: number;
  quantityAfter: number;
  unitCost?: number;
  reference?: string;
  notes?: string;
  createdBy: { id: string; name: string };
  createdAt: string;
}

// Mock data
const mockItem: InventoryItem = {
  id: '1',
  sku: 'MED-001',
  barcode: '1234567890123',
  name: 'Paracetamol 500mg',
  description: 'Acetaminophen 500mg tablets for pain relief and fever reduction',
  category: { id: '1', name: 'Medications' },
  supplier: { id: '1', name: 'PharmaCo Ltd' },
  unit: 'BOXES',
  quantityInStock: 150,
  reorderPoint: 50,
  reorderQuantity: 100,
  costPrice: 5.00,
  sellingPrice: 8.00,
  expiryDate: '2025-12-31',
  location: 'Shelf A-1',
  active: true,
  createdAt: '2024-01-01',
  updatedAt: '2024-01-15',
};

const mockMovements: Movement[] = [
  {
    id: '1',
    type: 'PURCHASE',
    quantity: 100,
    quantityBefore: 50,
    quantityAfter: 150,
    unitCost: 5.00,
    reference: 'PO-2024-001',
    notes: 'Monthly restock',
    createdBy: { id: '1', name: 'Admin User' },
    createdAt: '2024-01-15T10:30:00Z',
  },
  {
    id: '2',
    type: 'SALE',
    quantity: 10,
    quantityBefore: 60,
    quantityAfter: 50,
    reference: 'INV-2024-015',
    createdBy: { id: '2', name: 'Dr. Smith' },
    createdAt: '2024-01-10T14:20:00Z',
  },
  {
    id: '3',
    type: 'ADJUSTMENT_OUT',
    quantity: 5,
    quantityBefore: 65,
    quantityAfter: 60,
    notes: 'Expired items removed',
    createdBy: { id: '1', name: 'Admin User' },
    createdAt: '2024-01-08T09:00:00Z',
  },
  {
    id: '4',
    type: 'INITIAL',
    quantity: 65,
    quantityBefore: 0,
    quantityAfter: 65,
    notes: 'Initial stock entry',
    createdBy: { id: '1', name: 'Admin User' },
    createdAt: '2024-01-01T08:00:00Z',
  },
];

const movementTypeConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  PURCHASE: { label: 'Purchase', color: 'text-success', icon: <Plus className="h-4 w-4" /> },
  SALE: { label: 'Sale', color: 'text-destructive', icon: <Minus className="h-4 w-4" /> },
  ADJUSTMENT_IN: { label: 'Adjustment (+)', color: 'text-success', icon: <TrendingUp className="h-4 w-4" /> },
  ADJUSTMENT_OUT: { label: 'Adjustment (-)', color: 'text-destructive', icon: <TrendingDown className="h-4 w-4" /> },
  RETURN: { label: 'Return', color: 'text-success', icon: <TrendingUp className="h-4 w-4" /> },
  INITIAL: { label: 'Initial', color: 'text-primary', icon: <Package className="h-4 w-4" /> },
  EXPIRED: { label: 'Expired', color: 'text-destructive', icon: <TrendingDown className="h-4 w-4" /> },
  DAMAGED: { label: 'Damaged', color: 'text-destructive', icon: <TrendingDown className="h-4 w-4" /> },
};

export default function ItemDetailPage() {
  const params = useParams();
  const t = useTranslations();
  const [isAdjustDialogOpen, setIsAdjustDialogOpen] = React.useState(false);
  const [adjustmentData, setAdjustmentData] = React.useState({
    type: 'ADJUSTMENT_IN',
    quantity: 1,
    notes: '',
  });

  const item = mockItem;
  const movements = mockMovements;

  const getStockStatus = () => {
    if (item.quantityInStock === 0) return 'out';
    if (item.quantityInStock <= item.reorderPoint) return 'low';
    return 'ok';
  };

  const stockStatus = getStockStatus();

  const handleAdjustStock = () => {
    console.log('Adjusting stock:', adjustmentData);
    setIsAdjustDialogOpen(false);
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
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight">{item.name}</h1>
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
            </div>
            <p className="text-muted-foreground">{item.sku}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Dialog open={isAdjustDialogOpen} onOpenChange={setIsAdjustDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Package className="me-2 h-4 w-4" />
                {t('inventory.adjustStock') || 'Adjust Stock'}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t('inventory.adjustStock') || 'Adjust Stock'}</DialogTitle>
                <DialogDescription>
                  {t('inventory.adjustStockDescription') || 'Make adjustments to the current stock level.'}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label>{t('inventory.adjustmentType') || 'Adjustment Type'}</Label>
                  <Select
                    value={adjustmentData.type}
                    onValueChange={(value) => setAdjustmentData({ ...adjustmentData, type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ADJUSTMENT_IN">{t('inventory.addStock') || 'Add Stock (+)'}</SelectItem>
                      <SelectItem value="ADJUSTMENT_OUT">{t('inventory.removeStock') || 'Remove Stock (-)'}</SelectItem>
                      <SelectItem value="RETURN">{t('inventory.return') || 'Return'}</SelectItem>
                      <SelectItem value="EXPIRED">{t('inventory.expired') || 'Expired'}</SelectItem>
                      <SelectItem value="DAMAGED">{t('inventory.damaged') || 'Damaged'}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>{t('inventory.quantity') || 'Quantity'}</Label>
                  <Input
                    type="number"
                    min="1"
                    value={adjustmentData.quantity}
                    onChange={(e) => setAdjustmentData({ ...adjustmentData, quantity: parseInt(e.target.value) || 1 })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>{t('common.notes') || 'Notes'}</Label>
                  <Textarea
                    value={adjustmentData.notes}
                    onChange={(e) => setAdjustmentData({ ...adjustmentData, notes: e.target.value })}
                    placeholder="Reason for adjustment..."
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAdjustDialogOpen(false)}>
                  {t('common.cancel') || 'Cancel'}
                </Button>
                <Button onClick={handleAdjustStock}>
                  {t('inventory.confirm') || 'Confirm'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Button asChild>
            <Link href={`/inventory/${params.id}/edit`}>
              <Edit className="me-2 h-4 w-4" />
              {t('common.edit') || 'Edit'}
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className={`rounded-full p-3 ${stockStatus === 'ok' ? 'bg-success/10' : stockStatus === 'low' ? 'bg-warning/10' : 'bg-destructive/10'}`}>
                <Package className={`h-6 w-6 ${stockStatus === 'ok' ? 'text-success' : stockStatus === 'low' ? 'text-warning' : 'text-destructive'}`} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('inventory.currentStock') || 'Current Stock'}</p>
                <p className="text-2xl font-bold">{item.quantityInStock}</p>
                <p className="text-xs text-muted-foreground">{item.unit}</p>
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
                <p className="text-sm text-muted-foreground">{t('inventory.reorderPoint') || 'Reorder Point'}</p>
                <p className="text-2xl font-bold">{item.reorderPoint}</p>
                <p className="text-xs text-muted-foreground">{item.unit}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="rounded-full bg-primary/10 p-3">
                <TrendingDown className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('inventory.costPrice') || 'Cost Price'}</p>
                <p className="text-2xl font-bold">${item.costPrice?.toFixed(2) || '-'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="rounded-full bg-success/10 p-3">
                <TrendingUp className="h-6 w-6 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('inventory.sellingPrice') || 'Selling Price'}</p>
                <p className="text-2xl font-bold">${item.sellingPrice?.toFixed(2) || '-'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="details">
        <TabsList>
          <TabsTrigger value="details">{t('common.details') || 'Details'}</TabsTrigger>
          <TabsTrigger value="movements">
            <History className="me-2 h-4 w-4" />
            {t('inventory.movements') || 'Movements'}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('inventory.itemDetails') || 'Item Details'}</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid gap-4 md:grid-cols-2">
                <div>
                  <dt className="text-sm text-muted-foreground">{t('inventory.sku') || 'SKU'}</dt>
                  <dd className="font-medium">{item.sku}</dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">{t('inventory.barcode') || 'Barcode'}</dt>
                  <dd className="font-medium">{item.barcode || '-'}</dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">{t('inventory.category') || 'Category'}</dt>
                  <dd className="font-medium">{item.category?.name || '-'}</dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">{t('inventory.supplier') || 'Supplier'}</dt>
                  <dd className="font-medium">{item.supplier?.name || '-'}</dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">{t('inventory.unit') || 'Unit'}</dt>
                  <dd className="font-medium">{item.unit}</dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">{t('inventory.location') || 'Location'}</dt>
                  <dd className="font-medium">{item.location || '-'}</dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">{t('inventory.expiryDate') || 'Expiry Date'}</dt>
                  <dd className="font-medium">{item.expiryDate || '-'}</dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">{t('inventory.reorderQuantity') || 'Reorder Qty'}</dt>
                  <dd className="font-medium">{item.reorderQuantity}</dd>
                </div>
                <div className="md:col-span-2">
                  <dt className="text-sm text-muted-foreground">{t('common.description') || 'Description'}</dt>
                  <dd className="font-medium">{item.description || '-'}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="movements">
          <Card>
            <CardHeader>
              <CardTitle>{t('inventory.stockMovements') || 'Stock Movements'}</CardTitle>
              <CardDescription>
                {t('inventory.movementsDescription') || 'History of all stock changes for this item'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('common.date') || 'Date'}</TableHead>
                    <TableHead>{t('common.type') || 'Type'}</TableHead>
                    <TableHead>{t('inventory.quantity') || 'Qty'}</TableHead>
                    <TableHead>{t('inventory.before') || 'Before'}</TableHead>
                    <TableHead>{t('inventory.after') || 'After'}</TableHead>
                    <TableHead>{t('inventory.reference') || 'Reference'}</TableHead>
                    <TableHead>{t('common.notes') || 'Notes'}</TableHead>
                    <TableHead>{t('common.by') || 'By'}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {movements.map((movement) => {
                    const config = movementTypeConfig[movement.type] || { label: movement.type, color: 'text-muted-foreground', icon: null };
                    const isIncrease = ['PURCHASE', 'ADJUSTMENT_IN', 'RETURN', 'INITIAL'].includes(movement.type);
                    return (
                      <TableRow key={movement.id}>
                        <TableCell>
                          {new Date(movement.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div className={`flex items-center gap-1 ${config.color}`}>
                            {config.icon}
                            {config.label}
                          </div>
                        </TableCell>
                        <TableCell className={isIncrease ? 'text-success font-medium' : 'text-destructive font-medium'}>
                          {isIncrease ? '+' : '-'}{movement.quantity}
                        </TableCell>
                        <TableCell>{movement.quantityBefore}</TableCell>
                        <TableCell>{movement.quantityAfter}</TableCell>
                        <TableCell>
                          {movement.reference ? (
                            <Link href="#" className="text-primary hover:underline">
                              {movement.reference}
                            </Link>
                          ) : '-'}
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          {movement.notes || '-'}
                        </TableCell>
                        <TableCell>{movement.createdBy.name}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
