'use client';

import * as React from 'react';
import { Search, Check, Loader2 } from 'lucide-react';
import { Input } from './input';
import { cn } from '@/lib/utils';

interface SearchableListProps<T> {
  value: string;
  onValueChange: (value: string) => void;
  searchValue: string;
  onSearchChange: (value: string) => void;
  items: T[];
  isLoading?: boolean;
  isError?: boolean;
  minSearchLength?: number;
  searchPlaceholder?: string;
  searchHintText?: string;
  noResultsText?: string;
  errorText?: string;
  getItemValue: (item: T) => string;
  getItemKey: (item: T) => string;
  renderItem: (item: T) => React.ReactNode;
  error?: boolean;
  className?: string;
}

export function SearchableList<T>({
  value,
  onValueChange,
  searchValue,
  onSearchChange,
  items,
  isLoading = false,
  isError = false,
  minSearchLength = 2,
  searchPlaceholder = 'Search...',
  searchHintText = 'Type at least 2 characters to search',
  noResultsText = 'No results found',
  errorText = 'An error occurred',
  getItemValue,
  getItemKey,
  renderItem,
  error = false,
  className,
}: SearchableListProps<T>) {
  const isSearchActive = searchValue.length >= minSearchLength;

  return (
    <div className={cn('space-y-3', className)}>
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder={searchPlaceholder}
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          className="ps-9"
          error={error}
        />
      </div>

      {/* Hint when query too short */}
      {searchValue.length > 0 && searchValue.length < minSearchLength && (
        <p className="text-sm text-muted-foreground">{searchHintText}</p>
      )}

      {/* Loading state */}
      {isLoading && isSearchActive && (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Error state */}
      {isError && isSearchActive && (
        <div className="rounded-lg border border-destructive bg-destructive/10 p-3">
          <p className="text-sm text-destructive">{errorText}</p>
        </div>
      )}

      {/* No results */}
      {!isLoading && !isError && isSearchActive && items.length === 0 && (
        <p className="text-sm text-muted-foreground py-2">{noResultsText}</p>
      )}

      {/* Results list */}
      {!isLoading && !isError && items.length > 0 && (
        <div className="rounded-lg border divide-y max-h-60 overflow-y-auto">
          {items.map((item) => {
            const itemValue = getItemValue(item);
            const isSelected = value === itemValue;

            return (
              <button
                key={getItemKey(item)}
                type="button"
                onClick={() => onValueChange(itemValue)}
                className={cn(
                  'w-full px-3 py-2.5 text-start transition-colors hover:bg-muted/50',
                  isSelected && 'bg-muted'
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex-1 min-w-0">{renderItem(item)}</div>
                  {isSelected && (
                    <Check className="h-4 w-4 flex-shrink-0 text-primary" />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
