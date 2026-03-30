'use client';

import { useMemo, useState } from 'react';
import { Loader2, Search, SlidersHorizontal } from 'lucide-react';
import { ProductCard } from '@/src/components/Products/ProductCard';
import { AppAlert } from '@/src/components/common/AppAlert';
import { productsService, type ProductItem, type ProductsResponse } from '@/src/services/products.service';

type PublicProductsClientProps = {
  initialProducts: ProductItem[];
  initialPagination: ProductsResponse['pagination'];
};

type AvailabilityFilter = 'all' | 'available' | 'unavailable';
type SortOption = 'newest' | 'price-low' | 'price-high' | 'name';

const PAGE_SIZE = 12;

export function PublicProductsClient({
  initialProducts,
  initialPagination,
}: PublicProductsClientProps) {
  const [products, setProducts] = useState<ProductItem[]>(initialProducts);
  const [pagination, setPagination] = useState(initialPagination);
  const [page, setPage] = useState(initialPagination.page || 1);
  const [queryInput, setQueryInput] = useState('');
  const [activeQuery, setActiveQuery] = useState('');
  const [availability, setAvailability] = useState<AvailabilityFilter>('all');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadProducts = async (nextPage: number, nextQuery: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await productsService.getAllForClient({
        page: nextPage,
        limit: PAGE_SIZE,
        search: nextQuery || undefined,
      });

      setProducts(response.data);
      setPagination(response.pagination);
      setPage(nextPage);
      setActiveQuery(nextQuery);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load products.');
    } finally {
      setIsLoading(false);
    }
  };

  const visibleProducts = useMemo(() => {
    const filtered =
      availability === 'all'
        ? products
        : products.filter((product) =>
            availability === 'available' ? product.isAvailable : !product.isAvailable,
          );

    const next = [...filtered];

    switch (sortBy) {
      case 'price-low':
        return next.sort((a, b) => a.price - b.price);
      case 'price-high':
        return next.sort((a, b) => b.price - a.price);
      case 'name':
        return next.sort((a, b) => a.name.localeCompare(b.name));
      case 'newest':
      default:
        return next.sort((a, b) => {
          const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return dateB - dateA;
        });
    }
  }, [availability, products, sortBy]);

  const onSearchSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextQuery = queryInput.trim();
    void loadProducts(1, nextQuery);
  };

  const clearFilters = () => {
    setQueryInput('');
    setAvailability('all');
    setSortBy('newest');
    void loadProducts(1, '');
  };

  const goToPage = (nextPage: number) => {
    if (nextPage < 1 || nextPage > pagination.pages || isLoading) return;
    void loadProducts(nextPage, activeQuery);
  };

  return (
    <section className="space-y-6">
      <header className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-brand-rose">
          Public Products
        </p>
        <h1 className="text-3xl font-bold text-brand-ink">Find Your Perfect Cake</h1>
        <p className="max-w-2xl text-sm text-brand-ink-soft">
          Search by name, filter availability, and sort quickly to find what fits your event.
        </p>
      </header>

      <div className="rounded-2xl border border-brand-line bg-white p-4 shadow-sm sm:p-5">
        <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-brand-ink">
          <SlidersHorizontal className="h-4 w-4 text-brand-rose" />
          Search and Filters
        </div>

        <form onSubmit={onSearchSubmit} className="grid gap-3 md:grid-cols-[1fr_auto_auto_auto]">
          <label className="relative block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-ink-soft" />
            <input
              type="text"
              value={queryInput}
              onChange={(event) => setQueryInput(event.target.value)}
              placeholder="Search cakes by name or description"
              className="w-full rounded-xl border border-brand-line bg-brand-cream py-2.5 pl-9 pr-3 text-sm text-brand-ink outline-none transition focus:ring-2 focus:ring-brand-rose/40"
            />
          </label>

          <select
            value={availability}
            onChange={(event) => setAvailability(event.target.value as AvailabilityFilter)}
            className="rounded-xl border border-brand-line bg-brand-cream px-3 py-2.5 text-sm text-brand-ink outline-none transition focus:ring-2 focus:ring-brand-rose/40"
          >
            <option value="all">All availability</option>
            <option value="available">Available only</option>
            <option value="unavailable">Unavailable only</option>
          </select>

          <select
            value={sortBy}
            onChange={(event) => setSortBy(event.target.value as SortOption)}
            className="rounded-xl border border-brand-line bg-brand-cream px-3 py-2.5 text-sm text-brand-ink outline-none transition focus:ring-2 focus:ring-brand-rose/40"
          >
            <option value="newest">Newest first</option>
            <option value="price-low">Price: Low to high</option>
            <option value="price-high">Price: High to low</option>
            <option value="name">Name: A to Z</option>
          </select>

          <button
            type="submit"
            disabled={isLoading}
            className="rounded-xl bg-brand-rose px-4 py-2.5 text-sm font-semibold text-brand-ink transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading ? 'Searching...' : 'Search'}
          </button>
        </form>

        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-brand-ink-soft">
          <span>
            Showing {visibleProducts.length} item{visibleProducts.length === 1 ? '' : 's'} on page{' '}
            {pagination.page}
          </span>
          {(activeQuery || availability !== 'all' || sortBy !== 'newest') && (
            <button
              type="button"
              onClick={clearFilters}
              className="rounded-lg border border-brand-line px-2.5 py-1 text-xs font-medium text-brand-ink transition hover:bg-brand-cream"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      <AppAlert message={error} />

      {isLoading ? (
        <div className="flex items-center justify-center py-14">
          <Loader2 className="h-8 w-8 animate-spin text-brand-rose" />
        </div>
      ) : visibleProducts.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-brand-line bg-white py-16 text-center text-brand-ink-soft">
          No products found. Try a different search or clear filters.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visibleProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}

      {pagination.pages > 1 && (
        <div className="flex items-center justify-between border-t border-brand-line pt-4">
          <button
            type="button"
            onClick={() => goToPage(page - 1)}
            disabled={page <= 1 || isLoading}
            className="rounded-lg border border-brand-line px-4 py-2 text-sm font-medium text-brand-ink transition hover:bg-brand-cream-soft disabled:cursor-not-allowed disabled:opacity-50"
          >
            Previous
          </button>

          <span className="text-sm text-brand-ink-soft">
            Page {pagination.page} of {Math.max(1, pagination.pages)}
          </span>

          <button
            type="button"
            onClick={() => goToPage(page + 1)}
            disabled={page >= pagination.pages || isLoading}
            className="rounded-lg bg-brand-rose px-4 py-2 text-sm font-medium text-brand-ink transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </section>
  );
}
