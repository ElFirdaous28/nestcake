'use client';

import { FormEvent } from 'react';
import { ProductStatus } from '@shared-types';
import { Search } from 'lucide-react';

type ProductsFilterSectionProps = {
  searchQuery: string;
  statusFilter: ProductStatus | 'all';
  availabilityFilter: 'all' | 'available' | 'unavailable';
  searchPlaceholder?: string;
  showStatusFilter?: boolean;
  showAvailabilityFilter?: boolean;
  onSearchQueryChange: (value: string) => void;
  onStatusFilterChange: (value: ProductStatus | 'all') => void;
  onAvailabilityFilterChange: (value: 'all' | 'available' | 'unavailable') => void;
  onSearchSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

const prettyLabel = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);

export function ProductsFilterSection({
  searchQuery,
  statusFilter,
  availabilityFilter,
  searchPlaceholder = 'Search by product name or description...',
  showStatusFilter = true,
  showAvailabilityFilter = true,
  onSearchQueryChange,
  onStatusFilterChange,
  onAvailabilityFilterChange,
  onSearchSubmit,
}: ProductsFilterSectionProps) {
  const hasMetaFilters = showStatusFilter || showAvailabilityFilter;

  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
      {hasMetaFilters && (
        <div className="grid gap-3 sm:grid-cols-2 lg:w-90">
          {showStatusFilter && (
            <label className="space-y-1">
              <span className="text-sm font-medium text-brand-ink">Status</span>
              <select
                value={statusFilter}
                onChange={(event) =>
                  onStatusFilterChange(event.target.value as ProductStatus | 'all')
                }
                className="w-full rounded-lg border border-brand-line bg-white px-3 py-2 text-sm text-brand-ink focus:border-transparent focus:ring-2 focus:ring-brand-rose focus:outline-none"
              >
                <option value="all">All</option>
                <option value={ProductStatus.DRAFT}>{prettyLabel(ProductStatus.DRAFT)}</option>
                <option value={ProductStatus.PUBLISHED}>
                  {prettyLabel(ProductStatus.PUBLISHED)}
                </option>
              </select>
            </label>
          )}

          {showAvailabilityFilter && (
            <label className="space-y-1">
              <span className="text-sm font-medium text-brand-ink">Availability</span>
              <select
                value={availabilityFilter}
                onChange={(event) =>
                  onAvailabilityFilterChange(
                    event.target.value as 'all' | 'available' | 'unavailable',
                  )
                }
                className="w-full rounded-lg border border-brand-line bg-white px-3 py-2 text-sm text-brand-ink focus:border-transparent focus:ring-2 focus:ring-brand-rose focus:outline-none"
              >
                <option value="all">All</option>
                <option value="available">Available</option>
                <option value="unavailable">Unavailable</option>
              </select>
            </label>
          )}
        </div>
      )}

      <form onSubmit={onSearchSubmit} className="flex flex-1 gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-brand-ink-soft" />
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={searchQuery}
            onChange={(event) => onSearchQueryChange(event.target.value)}
            className="w-full rounded-lg border border-brand-line py-2 pr-4 pl-10 focus:border-transparent focus:ring-2 focus:ring-brand-rose focus:outline-none"
          />
        </div>
        <button
          type="submit"
          className="rounded-lg bg-brand-rose px-4 py-2 font-medium text-white transition hover:bg-brand-rose/90"
        >
          Search
        </button>
      </form>
    </div>
  );
}
