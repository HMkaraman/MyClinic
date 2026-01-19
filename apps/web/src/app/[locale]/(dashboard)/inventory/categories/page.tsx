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
import {
  Plus,
  Search,
  MoreHorizontal,
  Edit,
  Trash2,
  ArrowLeft,
  FolderTree,
} from 'lucide-react';

interface Category {
  id: string;
  name: string;
  nameAr?: string;
  parentId?: string;
  parent?: { id: string; name: string };
  itemCount: number;
  active: boolean;
}

// Mock data
const mockCategories: Category[] = [
  { id: '1', name: 'Medications', nameAr: 'الأدوية', itemCount: 45, active: true },
  { id: '2', name: 'Supplies', nameAr: 'المستلزمات', itemCount: 32, active: true },
  { id: '3', name: 'Equipment', nameAr: 'المعدات', itemCount: 12, active: true },
  { id: '4', name: 'Prescription Drugs', nameAr: 'أدوية بوصفة', parentId: '1', parent: { id: '1', name: 'Medications' }, itemCount: 25, active: true },
  { id: '5', name: 'OTC Drugs', nameAr: 'أدوية بدون وصفة', parentId: '1', parent: { id: '1', name: 'Medications' }, itemCount: 20, active: true },
  { id: '6', name: 'Consumables', nameAr: 'المواد الاستهلاكية', parentId: '2', parent: { id: '2', name: 'Supplies' }, itemCount: 18, active: true },
  { id: '7', name: 'Instruments', nameAr: 'الأدوات', parentId: '2', parent: { id: '2', name: 'Supplies' }, itemCount: 14, active: true },
  { id: '8', name: 'Diagnostic', nameAr: 'التشخيص', parentId: '3', parent: { id: '3', name: 'Equipment' }, itemCount: 8, active: true },
];

export default function CategoriesPage() {
  const t = useTranslations();
  const [searchQuery, setSearchQuery] = React.useState('');
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [editingCategory, setEditingCategory] = React.useState<Category | null>(null);
  const [formData, setFormData] = React.useState({ name: '', nameAr: '', parentId: '' });

  const filteredCategories = mockCategories.filter((category) =>
    category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (category.nameAr && category.nameAr.includes(searchQuery))
  );

  const rootCategories = filteredCategories.filter(c => !c.parentId);

  const handleOpenDialog = (category?: Category) => {
    if (category) {
      setEditingCategory(category);
      setFormData({ name: category.name, nameAr: category.nameAr || '', parentId: category.parentId || '' });
    } else {
      setEditingCategory(null);
      setFormData({ name: '', nameAr: '', parentId: '' });
    }
    setIsDialogOpen(true);
  };

  const handleSave = () => {
    // API call would go here
    console.log('Saving category:', formData);
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
              {t('inventory.categories') || 'Categories'}
            </h1>
            <p className="text-muted-foreground">
              {t('inventory.categoriesDescription') || 'Organize your inventory items'}
            </p>
          </div>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="me-2 h-4 w-4" />
              {t('inventory.newCategory') || 'New Category'}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingCategory
                  ? t('inventory.editCategory') || 'Edit Category'
                  : t('inventory.newCategory') || 'New Category'}
              </DialogTitle>
              <DialogDescription>
                {t('inventory.categoryDialogDescription') || 'Add or edit inventory category details.'}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">{t('common.name') || 'Name'}</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Category name"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="nameAr">{t('common.nameAr') || 'Arabic Name'}</Label>
                <Input
                  id="nameAr"
                  value={formData.nameAr}
                  onChange={(e) => setFormData({ ...formData, nameAr: e.target.value })}
                  placeholder="اسم الفئة"
                  dir="rtl"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="parentId">{t('inventory.parentCategory') || 'Parent Category'}</Label>
                <select
                  id="parentId"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                  value={formData.parentId}
                  onChange={(e) => setFormData({ ...formData, parentId: e.target.value })}
                >
                  <option value="">{t('common.none') || 'None (Root Category)'}</option>
                  {rootCategories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
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
              placeholder={t('inventory.searchCategories') || 'Search categories...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="ps-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Categories Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FolderTree className="h-5 w-5" />
            {t('inventory.allCategories') || 'All Categories'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('common.name') || 'Name'}</TableHead>
                <TableHead>{t('common.nameAr') || 'Arabic Name'}</TableHead>
                <TableHead>{t('inventory.parentCategory') || 'Parent'}</TableHead>
                <TableHead>{t('inventory.itemCount') || 'Items'}</TableHead>
                <TableHead>{t('common.status') || 'Status'}</TableHead>
                <TableHead className="w-[70px]">{t('common.actions') || 'Actions'}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCategories.map((category) => (
                <TableRow key={category.id}>
                  <TableCell className="font-medium">
                    {category.parentId && <span className="text-muted-foreground me-2">└</span>}
                    {category.name}
                  </TableCell>
                  <TableCell dir="rtl">{category.nameAr || '-'}</TableCell>
                  <TableCell>{category.parent?.name || '-'}</TableCell>
                  <TableCell>{category.itemCount}</TableCell>
                  <TableCell>
                    <Badge variant={category.active ? 'success' : 'secondary'}>
                      {category.active ? t('common.active') || 'Active' : t('common.inactive') || 'Inactive'}
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
                        <DropdownMenuItem onClick={() => handleOpenDialog(category)}>
                          <Edit className="me-2 h-4 w-4" />
                          {t('common.edit') || 'Edit'}
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
