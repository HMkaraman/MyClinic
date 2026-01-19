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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Plus,
  Search,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  ArrowLeft,
  Building2,
  Phone,
  Mail,
  ShoppingCart,
} from 'lucide-react';

interface Supplier {
  id: string;
  name: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: string;
  paymentTerms?: string;
  itemCount: number;
  orderCount: number;
  active: boolean;
}

// Mock data
const mockSuppliers: Supplier[] = [
  {
    id: '1',
    name: 'PharmaCo Ltd',
    contactPerson: 'John Smith',
    email: 'orders@pharmaco.com',
    phone: '+1 555 123 4567',
    address: '123 Medical Drive, Health City',
    paymentTerms: 'Net 30',
    itemCount: 45,
    orderCount: 12,
    active: true,
  },
  {
    id: '2',
    name: 'MedSupply Inc',
    contactPerson: 'Sarah Johnson',
    email: 'sales@medsupply.com',
    phone: '+1 555 234 5678',
    address: '456 Supply Lane, Commerce Town',
    paymentTerms: 'Net 15',
    itemCount: 32,
    orderCount: 8,
    active: true,
  },
  {
    id: '3',
    name: 'HealthTech',
    contactPerson: 'Mike Brown',
    email: 'info@healthtech.com',
    phone: '+1 555 345 6789',
    address: '789 Tech Blvd, Innovation Park',
    paymentTerms: 'Net 45',
    itemCount: 18,
    orderCount: 5,
    active: true,
  },
  {
    id: '4',
    name: 'Global Medical',
    contactPerson: 'Emma Davis',
    email: 'orders@globalmed.com',
    phone: '+1 555 456 7890',
    paymentTerms: 'COD',
    itemCount: 0,
    orderCount: 0,
    active: false,
  },
];

export default function SuppliersPage() {
  const t = useTranslations();
  const [searchQuery, setSearchQuery] = React.useState('');
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [editingSupplier, setEditingSupplier] = React.useState<Supplier | null>(null);
  const [formData, setFormData] = React.useState({
    name: '',
    contactPerson: '',
    email: '',
    phone: '',
    address: '',
    paymentTerms: '',
  });

  const filteredSuppliers = mockSuppliers.filter((supplier) =>
    supplier.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (supplier.contactPerson && supplier.contactPerson.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleOpenDialog = (supplier?: Supplier) => {
    if (supplier) {
      setEditingSupplier(supplier);
      setFormData({
        name: supplier.name,
        contactPerson: supplier.contactPerson || '',
        email: supplier.email || '',
        phone: supplier.phone || '',
        address: supplier.address || '',
        paymentTerms: supplier.paymentTerms || '',
      });
    } else {
      setEditingSupplier(null);
      setFormData({ name: '', contactPerson: '', email: '', phone: '', address: '', paymentTerms: '' });
    }
    setIsDialogOpen(true);
  };

  const handleSave = () => {
    console.log('Saving supplier:', formData);
    setIsDialogOpen(false);
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
              {t('inventory.suppliers') || 'Suppliers'}
            </h1>
            <p className="text-muted-foreground">
              {t('inventory.suppliersDescription') || 'Manage your inventory suppliers'}
            </p>
          </div>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="me-2 h-4 w-4" />
              {t('inventory.newSupplier') || 'New Supplier'}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingSupplier
                  ? t('inventory.editSupplier') || 'Edit Supplier'
                  : t('inventory.newSupplier') || 'New Supplier'}
              </DialogTitle>
              <DialogDescription>
                {t('inventory.supplierDialogDescription') || 'Add or edit supplier information.'}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">{t('inventory.supplierName') || 'Company Name'} *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter company name"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="contactPerson">{t('inventory.contactPerson') || 'Contact Person'}</Label>
                <Input
                  id="contactPerson"
                  value={formData.contactPerson}
                  onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                  placeholder="Enter contact name"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="email">{t('common.email') || 'Email'}</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="email@example.com"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="phone">{t('common.phone') || 'Phone'}</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+1 555 000 0000"
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="address">{t('common.address') || 'Address'}</Label>
                <Textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Enter address"
                  rows={2}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="paymentTerms">{t('inventory.paymentTerms') || 'Payment Terms'}</Label>
                <Input
                  id="paymentTerms"
                  value={formData.paymentTerms}
                  onChange={(e) => setFormData({ ...formData, paymentTerms: e.target.value })}
                  placeholder="e.g., Net 30"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                {t('common.cancel') || 'Cancel'}
              </Button>
              <Button onClick={handleSave}>
                {t('common.save') || 'Save'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={t('inventory.searchSuppliers') || 'Search suppliers...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="ps-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Suppliers Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            {t('inventory.allSuppliers') || 'All Suppliers'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('inventory.supplierName') || 'Company'}</TableHead>
                <TableHead>{t('inventory.contactPerson') || 'Contact'}</TableHead>
                <TableHead>{t('common.phone') || 'Phone'}</TableHead>
                <TableHead>{t('inventory.paymentTerms') || 'Terms'}</TableHead>
                <TableHead>{t('inventory.items') || 'Items'}</TableHead>
                <TableHead>{t('common.status') || 'Status'}</TableHead>
                <TableHead className="w-[70px]">{t('common.actions') || 'Actions'}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSuppliers.map((supplier) => (
                <TableRow key={supplier.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{supplier.name}</p>
                      {supplier.email && (
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {supplier.email}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{supplier.contactPerson || '-'}</TableCell>
                  <TableCell dir="ltr">
                    {supplier.phone ? (
                      <span className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {supplier.phone}
                      </span>
                    ) : '-'}
                  </TableCell>
                  <TableCell>{supplier.paymentTerms || '-'}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span>{supplier.itemCount} items</span>
                      <span className="text-muted-foreground">|</span>
                      <span className="text-muted-foreground">{supplier.orderCount} orders</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={supplier.active ? 'success' : 'secondary'}>
                      {supplier.active ? t('common.active') || 'Active' : t('common.inactive') || 'Inactive'}
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
                          <Link href={`/inventory/suppliers/${supplier.id}`}>
                            <Eye className="me-2 h-4 w-4" />
                            {t('common.view') || 'View'}
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleOpenDialog(supplier)}>
                          <Edit className="me-2 h-4 w-4" />
                          {t('common.edit') || 'Edit'}
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/inventory/purchase-orders/new?supplierId=${supplier.id}`}>
                            <ShoppingCart className="me-2 h-4 w-4" />
                            {t('inventory.newOrder') || 'New Order'}
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">
                          <Trash2 className="me-2 h-4 w-4" />
                          {t('common.delete') || 'Delete'}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
