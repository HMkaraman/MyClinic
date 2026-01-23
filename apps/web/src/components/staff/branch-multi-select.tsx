'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { Check, ChevronsUpDown, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { usersApi, type Branch } from '@/lib/users-api';

interface BranchMultiSelectProps {
  value: string[];
  onChange: (value: string[]) => void;
  error?: string;
  disabled?: boolean;
}

export function BranchMultiSelect({
  value,
  onChange,
  error,
  disabled,
}: BranchMultiSelectProps) {
  const t = useTranslations();
  const [open, setOpen] = React.useState(false);
  const [branches, setBranches] = React.useState<Branch[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    async function fetchBranches() {
      try {
        const data = await usersApi.getBranches();
        setBranches(data);
      } catch (err) {
        console.error('Failed to fetch branches:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchBranches();
  }, []);

  const selectedBranches = branches.filter((b) => value.includes(b.id));

  const handleToggle = (branchId: string) => {
    if (value.includes(branchId)) {
      onChange(value.filter((id) => id !== branchId));
    } else {
      onChange([...value, branchId]);
    }
  };

  const handleRemove = (branchId: string) => {
    onChange(value.filter((id) => id !== branchId));
  };

  return (
    <div className="space-y-2">
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled || loading}
            className={cn(
              'w-full justify-between',
              error && 'border-destructive',
              !value.length && 'text-muted-foreground'
            )}
          >
            {loading
              ? t('common.loading')
              : value.length > 0
              ? `${value.length} ${t('staff.branches').toLowerCase()}`
              : t('staff.selectBranches')}
            <ChevronsUpDown className="ms-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-[280px] p-2" align="start">
          <div className="max-h-60 overflow-y-auto space-y-1">
            {branches.map((branch) => (
              <div
                key={branch.id}
                className="flex items-center gap-2 rounded-sm px-2 py-1.5 hover:bg-muted cursor-pointer"
                onClick={() => handleToggle(branch.id)}
              >
                <Checkbox
                  id={`branch-${branch.id}`}
                  checked={value.includes(branch.id)}
                  onCheckedChange={() => handleToggle(branch.id)}
                />
                <label
                  htmlFor={`branch-${branch.id}`}
                  className="flex-1 text-sm cursor-pointer"
                >
                  {branch.name}
                </label>
                {value.includes(branch.id) && (
                  <Check className="h-4 w-4 text-primary" />
                )}
              </div>
            ))}
            {branches.length === 0 && !loading && (
              <div className="text-sm text-muted-foreground text-center py-4">
                {t('common.noResults')}
              </div>
            )}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

      {selectedBranches.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {selectedBranches.map((branch) => (
            <Badge key={branch.id} variant="secondary" className="gap-1">
              {branch.name}
              <button
                type="button"
                className="rounded-full outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2"
                onClick={() => handleRemove(branch.id)}
                disabled={disabled}
              >
                <X className="h-3 w-3" />
                <span className="sr-only">{t('common.delete')}</span>
              </button>
            </Badge>
          ))}
        </div>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
