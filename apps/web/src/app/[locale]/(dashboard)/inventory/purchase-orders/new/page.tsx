'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  ArrowLeft,
  Plus,
  Trash2,
  ShoppingCart,
  Save,
  Send,
} from 'lucide-react';

interface Supplier {
  id: string;
  name: string;
}

interface InventoryItem {
  id: string;
  sku: string;
  name: string;
  costPrice?: number;
}

interface OrderItem {
  itemId: string;
  item?: InventoryItem;
  quantity: number;
  unitCost: number;
}

// Mock data
const mockSuppliers: Supplier[] = [
  { id: '1', name: 'PharmaCo Ltd' },
  { id: '2', name: 'MedSupply Inc' },
  { id: '3', name: 'HealthTech' },
];

const mockItems: InventoryItem[] = [
  { id: '1', sku: 'MED-001', name: 'Paracetamol 500mg', costPrice: 5.00 },
  { id: '2', sku: 'MED-002', name: 'Ibuprofen 400mg', costPrice: 6.00 },
  { id: '3', sku: 'SUP-001', name: 'Surgical Gloves (M)', costPrice: 15.00 },
  { id: '4', sku: 'SUP-002', name: 'Syringes 5ml', costPrice: 0.50 },
  { id: '5', sku: 'EQP-001', name: 'Blood Pressure Monitor', costPrice: 150.00 },
];

export default function NewPurchaseOrderPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations();

  const [formData, setFormData] = React.useState({
    supplierId: searchParams.get('supplierId') || '',
    orderDate: new Date().toISOString().split('T')[0],
    expectedDate: '',
    tax: 0,
    shipping: 0,
    notes: '',
  });

  const [orderItems, setOrderItems] = React.useState<OrderItem[]>([]);
  const [newItem, setNewItem] = React.useState({
    itemId: '',
    quantity: 1,
    unitCost: 0,
  });

  const addItem = () => {
    if (!newItem.itemId) return;

    const item = mockItems.find(i => i.id === newItem.itemId);
    if (!item) return;

    const existingIndex = orderItems.findIndex(i => i.itemId === newItem.itemId);
    if (existingIndex >= 0) {
      // Update existing item quantity
      const updated = [...orderItems];
      const existingItem = updated[existingIndex];
      if (existingItem) {
        existingItem.quantity += newItem.quantity;
      }
      setOrderItems(updated);
    } else {
      setOrderItems([...orderItems, {
        itemId: newItem.itemId,
        item,
        quantity: newItem.quantity,
        unitCost: newItem.unitCost || item.costPrice || 0,
      }]);
    }

    setNewItem({ itemId: '', quantity: 1, unitCost: 0 });
  };

  const removeItem = (index: number) => {
    setOrderItems(orderItems.filter((_, i) => i !== index));
  };

  const updateItemQuantity = (index: number, quantity: number) => {
    const updated = [...orderItems];
    const item = updated[index];
    if (item) {
      item.quantity = quantity;
    }
    setOrderItems(updated);
  };

  const updateItemCost = (index: number, unitCost: number) => {
    const updated = [...orderItems];
    const item = updated[index];
    if (item) {
      item.unitCost = unitCost;
    }
    setOrderItems(updated);
  };

  const subtotal = orderItems.reduce((sum, item) => sum + (item.quantity * item.unitCost), 0);
  const total = subtotal + formData.tax + formData.shipping;

  const handleSaveDraft = () => {
    console.log('Saving draft:', { ...formData, items: orderItems });
    router.push('/inventory/purchase-orders');
  };

  const handleSubmit = () => {
    console.log('Submitting order:', { ...formData, items: orderItems });
    router.push('/inventory/purchase-orders');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/inventory/purchase-orders">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {t('inventory.newPurchaseOrder') || 'New Purchase Order'}
            </h1>
            <p className="text-muted-foreground">
              {t('inventory.createOrderDescription') || 'Create a new purchase order for your supplier'}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleSaveDraft}>
            <Save className="me-2 h-4 w-4" />
            {t('common.saveDraft') || 'Save Draft'}
          </Button>
          <Button onClick={handleSubmit} disabled={orderItems.length === 0 || !formData.supplierId}>
            <Send className="me-2 h-4 w-4" />
            {t('inventory.submitOrder') || 'Submit Order'}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Order Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Supplier & Dates */}
          <Card>
            <CardHeader>
              <CardTitle>{t('inventory.orderDetails') || 'Order Details'}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="supplier">{t('inventory.supplier') || 'Supplier'} *</Label>
                  <Select
                    value={formData.supplierId}
                    onValueChange={(value) => setFormData({ ...formData, supplierId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t('inventory.selectSupplier') || 'Select supplier'} />
                    </SelectTrigger>
                    <SelectContent>
                      {mockSuppliers.map((supplier) => (
                        <SelectItem key={supplier.id} value={supplier.id}>
                          {supplier.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="orderDate">{t('inventory.orderDate') || 'Order Date'} *</Label>
                  <Input
                    id="orderDate"
                    type="date"
                    value={formData.orderDate}
                    onChange={(e) => setFormData({ ...formData, orderDate: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="expectedDate">{t('inventory.expectedDate') || 'Expected Delivery'}</Label>
                  <Input
                    id="expectedDate"
                    type="date"
                    value={formData.expectedDate}
                    onChange={(e) => setFormData({ ...formData, expectedDate: e.target.value })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Order Items */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                {t('inventory.orderItems') || 'Order Items'}
              </CardTitle>
              <CardDescription>
                {t('inventory.addItemsDescription') || 'Add items to your purchase order'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Add Item Row */}
              <div className="flex gap-2 items-end flex-wrap">
                <div className="flex-1 min-w-[200px]">
                  <Label>{t('inventory.item') || 'Item'}</Label>
                  <Select
                    value={newItem.itemId}
                    onValueChange={(value) => {
                      const item = mockItems.find(i => i.id === value);
                      setNewItem({ ...newItem, itemId: value, unitCost: item?.costPrice || 0 });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t('inventory.selectItem') || 'Select item'} />
                    </SelectTrigger>
                    <SelectContent>
                      {mockItems.map((item) => (
                        <SelectItem key={item.id} value={item.id}>
                          {item.sku} - {item.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="w-24">
                  <Label>{t('inventory.qty') || 'Qty'}</Label>
                  <Input
                    type="number"
                    min="1"
                    value={newItem.quantity}
                    onChange={(e) => setNewItem({ ...newItem, quantity: parseInt(e.target.value) || 1 })}
                  />
                </div>
                <div className="w-32">
                  <Label>{t('inventory.unitCost') || 'Unit Cost'}</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={newItem.unitCost}
                    onChange={(e) => setNewItem({ ...newItem, unitCost: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <Button onClick={addItem} disabled={!newItem.itemId}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {/* Items Table */}
              {orderItems.length > 0 && (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('inventory.item') || 'Item'}</TableHead>
                      <TableHead className="w-24">{t('inventory.qty') || 'Qty'}</TableHead>
                      <TableHead className="w-32">{t('inventory.unitCost') || 'Unit Cost'}</TableHead>
                      <TableHead className="w-32">{t('inventory.total') || 'Total'}</TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orderItems.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{item.item?.name}</p>
                            <p className="text-sm text-muted-foreground">{item.item?.sku}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => updateItemQuantity(index, parseInt(e.target.value) || 1)}
                            className="w-20"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.unitCost}
                            onChange={(e) => updateItemCost(index, parseFloat(e.target.value) || 0)}
                            className="w-24"
                          />
                        </TableCell>
                        <TableCell className="font-medium">
                          ${(item.quantity * item.unitCost).toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeItem(index)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}

              {orderItems.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  {t('inventory.noItemsAdded') || 'No items added yet. Select items above to add to the order.'}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Notes */}
          <Card>
            <CardHeader>
              <CardTitle>{t('common.notes') || 'Notes'}</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder={t('inventory.orderNotes') || 'Add any notes or special instructions...'}
                rows={3}
              />
            </CardContent>
          </Card>
        </div>

        {/* Order Summary */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('inventory.orderSummary') || 'Order Summary'}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{t('inventory.items') || 'Items'}</span>
                  <span>{orderItems.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{t('inventory.subtotal') || 'Subtotal'}</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
              </div>

              <div className="space-y-2 border-t pt-4">
                <div className="flex gap-2 items-center">
                  <Label className="w-20">{t('inventory.tax') || 'Tax'}</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.tax}
                    onChange={(e) => setFormData({ ...formData, tax: parseFloat(e.target.value) || 0 })}
                    className="flex-1"
                  />
                </div>
                <div className="flex gap-2 items-center">
                  <Label className="w-20">{t('inventory.shipping') || 'Shipping'}</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.shipping}
                    onChange={(e) => setFormData({ ...formData, shipping: parseFloat(e.target.value) || 0 })}
                    className="flex-1"
                  />
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="flex justify-between text-lg font-bold">
                  <span>{t('inventory.total') || 'Total'}</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
