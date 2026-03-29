'use client';

import { FormEvent } from 'react';
import { Search } from 'lucide-react';

type FilterOption = {
  value: string;
  label: string;
};

type ProfessionalFiltersBarProps = {
  searchQuery: string;
  searchPlaceholder: string;
  searchError?: string;
  onSearchQueryChange: (value: string) => void;
  onSearchSubmit: (event: FormEvent<HTMLFormElement>) => void;
  primaryFilterLabel: string;
  primaryFilterValue: string;
  primaryFilterOptions: FilterOption[];
  onPrimaryFilterChange: (value: string) => void;
  secondaryFilterLabel?: string;
  secondaryFilterValue?: string;
  secondaryFilterOptions?: FilterOption[];
  onSecondaryFilterChange?: (value: string) => void;
};

export function ProfessionalFiltersBar({
  searchQuery,
  searchPlaceholder,
  searchError,
  onSearchQueryChange,
  onSearchSubmit,
  primaryFilterLabel,
  primaryFilterValue,
  primaryFilterOptions,
  onPrimaryFilterChange,
  secondaryFilterLabel,
  secondaryFilterValue,
  secondaryFilterOptions,
  onSecondaryFilterChange,
}: ProfessionalFiltersBarProps) {
  const hasSecondaryFilter =
    Boolean(secondaryFilterLabel) &&
    Boolean(secondaryFilterOptions?.length) &&
    Boolean(onSecondaryFilterChange);

  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
      <div className={`grid gap-3 ${hasSecondaryFilter ? 'sm:grid-cols-2 lg:w-120' : 'lg:w-56'}`}>
        <label className="space-y-1">
          <span className="text-sm font-medium text-brand-ink">{primaryFilterLabel}</span>
          <select
            value={primaryFilterValue}
            onChange={(event) => onPrimaryFilterChange(event.target.value)}
            className="w-full rounded-lg border border-brand-line bg-white px-3 py-2 text-sm text-brand-ink focus:border-transparent focus:ring-2 focus:ring-brand-rose focus:outline-none"
          >
            {primaryFilterOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        {hasSecondaryFilter ? (
          <label className="space-y-1">
            <span className="text-sm font-medium text-brand-ink">{secondaryFilterLabel}</span>
            <select
              value={secondaryFilterValue}
              onChange={(event) => onSecondaryFilterChange?.(event.target.value)}
              className="w-full rounded-lg border border-brand-line bg-white px-3 py-2 text-sm text-brand-ink focus:border-transparent focus:ring-2 focus:ring-brand-rose focus:outline-none"
            >
              {secondaryFilterOptions?.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        ) : null}
      </div>

      <form onSubmit={onSearchSubmit} className="flex flex-1 gap-3">
        <div className="flex-1">
          <div className="relative">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-brand-ink-soft" />
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={searchQuery}
            onChange={(event) => onSearchQueryChange(event.target.value)}
            className="w-full rounded-lg border border-brand-line py-2 pr-4 pl-10 focus:border-transparent focus:ring-2 focus:ring-brand-rose focus:outline-none"
          />
          </div>
          {searchError ? <p className="mt-1 text-xs text-brand-danger">{searchError}</p> : null}
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
