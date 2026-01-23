'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { BranchMultiSelect } from './branch-multi-select';
import {
  usersApi,
  type User,
  type UserRole,
  type UserStatus,
  type CreateUserDto,
  type UpdateUserDto,
} from '@/lib/users-api';
import { useToast } from '@/hooks/use-toast';

interface StaffFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'create' | 'edit';
  staff?: User | null;
  onSuccess: () => void;
}

const STAFF_ROLES: UserRole[] = ['DOCTOR', 'NURSE', 'RECEPTION', 'MANAGER', 'ACCOUNTANT', 'SUPPORT'];
const LANGUAGES = ['ar', 'en', 'ckb', 'kmr'] as const;

export function StaffFormDialog({
  open,
  onOpenChange,
  mode,
  staff,
  onSuccess,
}: StaffFormDialogProps) {
  const t = useTranslations();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const [formData, setFormData] = React.useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    role: '' as UserRole | '',
    branchIds: [] as string[],
    language: 'en' as 'ar' | 'en' | 'ckb' | 'kmr',
    status: 'ACTIVE' as UserStatus,
  });

  const [errors, setErrors] = React.useState<Record<string, string>>({});

  React.useEffect(() => {
    if (open) {
      if (mode === 'edit' && staff) {
        setFormData({
          name: staff.name || '',
          email: staff.email || '',
          phone: staff.phone || '',
          password: '',
          confirmPassword: '',
          role: staff.role,
          branchIds: staff.branchIds || [],
          language: staff.language || 'en',
          status: staff.status,
        });
      } else {
        setFormData({
          name: '',
          email: '',
          phone: '',
          password: '',
          confirmPassword: '',
          role: '',
          branchIds: [],
          language: 'en',
          status: 'ACTIVE',
        });
      }
      setErrors({});
    }
  }, [open, mode, staff]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = t('errors.required');
    }

    if (!formData.email.trim()) {
      newErrors.email = t('errors.required');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = t('errors.invalidEmail');
    }

    if (!formData.role) {
      newErrors.role = t('errors.required');
    }

    if (formData.branchIds.length === 0) {
      newErrors.branchIds = t('staff.noBranchesError');
    }

    if (mode === 'create') {
      if (!formData.password) {
        newErrors.password = t('errors.required');
      } else if (formData.password.length < 8) {
        newErrors.password = t('errors.minLength', { min: 8 });
      } else if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>])/.test(formData.password)) {
        newErrors.password = t('staff.passwordHelp');
      }

      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = t('staff.passwordMismatch');
      }
    } else if (formData.password) {
      if (formData.password.length < 8) {
        newErrors.password = t('errors.minLength', { min: 8 });
      } else if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>])/.test(formData.password)) {
        newErrors.password = t('staff.passwordHelp');
      }

      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = t('staff.passwordMismatch');
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      if (mode === 'create') {
        const createData: CreateUserDto = {
          name: formData.name,
          email: formData.email,
          password: formData.password,
          role: formData.role as UserRole,
          branchIds: formData.branchIds,
          language: formData.language,
        };
        if (formData.phone) {
          createData.phone = formData.phone;
        }
        await usersApi.createUser(createData);
        toast({ title: t('staff.createSuccess') });
      } else if (staff) {
        const updateData: UpdateUserDto = {
          name: formData.name,
          email: formData.email,
          role: formData.role as UserRole,
          branchIds: formData.branchIds,
          language: formData.language,
          status: formData.status,
        };
        if (formData.phone) {
          updateData.phone = formData.phone;
        }
        if (formData.password) {
          updateData.password = formData.password;
        }
        await usersApi.updateUser(staff.id, updateData);
        toast({ title: t('staff.updateSuccess') });
      }

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to save staff:', error);
      toast({ title: t('common.error'), variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? t('staff.addStaff') : t('staff.editStaff')}
          </DialogTitle>
          <DialogDescription>
            {t('staff.description')}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">{t('staff.name')} *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className={errors.name ? 'border-destructive' : ''}
              disabled={isSubmitting}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">{t('staff.email')} *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className={errors.email ? 'border-destructive' : ''}
              disabled={isSubmitting}
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">{t('staff.phone')}</Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              disabled={isSubmitting}
              dir="ltr"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">{t('staff.role')} *</Label>
            <Select
              value={formData.role}
              onValueChange={(value) => setFormData({ ...formData, role: value as UserRole })}
              disabled={isSubmitting}
            >
              <SelectTrigger className={errors.role ? 'border-destructive' : ''}>
                <SelectValue placeholder={t('staff.filterByRole')} />
              </SelectTrigger>
              <SelectContent>
                {STAFF_ROLES.map((role) => (
                  <SelectItem key={role} value={role}>
                    {t(`roles.${role.toLowerCase()}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.role && (
              <p className="text-sm text-destructive">{errors.role}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>{t('staff.branches')} *</Label>
            <BranchMultiSelect
              value={formData.branchIds}
              onChange={(value) => setFormData({ ...formData, branchIds: value })}
              error={errors.branchIds}
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">
              {t('staff.password')} {mode === 'create' && '*'}
            </Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className={errors.password ? 'border-destructive' : ''}
              disabled={isSubmitting}
              placeholder={mode === 'edit' ? t('staff.passwordHelp') : undefined}
            />
            {mode === 'create' && (
              <p className="text-xs text-muted-foreground">{t('staff.passwordHelp')}</p>
            )}
            {errors.password && (
              <p className="text-sm text-destructive">{errors.password}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">
              {t('staff.confirmPassword')} {mode === 'create' && '*'}
            </Label>
            <Input
              id="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              className={errors.confirmPassword ? 'border-destructive' : ''}
              disabled={isSubmitting}
            />
            {errors.confirmPassword && (
              <p className="text-sm text-destructive">{errors.confirmPassword}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="language">{t('staff.language')}</Label>
            <Select
              value={formData.language}
              onValueChange={(value) => setFormData({ ...formData, language: value as 'ar' | 'en' | 'ckb' | 'kmr' })}
              disabled={isSubmitting}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LANGUAGES.map((lang) => (
                  <SelectItem key={lang} value={lang}>
                    {lang === 'en' ? 'English' : lang === 'ar' ? 'العربية' : lang === 'ckb' ? 'کوردی سۆرانی' : 'Kurmancî'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {mode === 'edit' && (
            <div className="space-y-2">
              <Label htmlFor="status">{t('staff.status')}</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value as UserStatus })}
                disabled={isSubmitting}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">{t('common.active')}</SelectItem>
                  <SelectItem value="INACTIVE">{t('common.inactive')}</SelectItem>
                  <SelectItem value="SUSPENDED">{t('staff.suspended')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? t('common.loading') : t('common.save')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
