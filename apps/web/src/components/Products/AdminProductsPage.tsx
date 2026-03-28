'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { ProductStatus } from '@shared-types';
import { Loader2 } from 'lucide-react';
import { AppAlert } from '@/src/components/common/AppAlert';
import { ConfirmDialog } from '@/src/components/common/ConfirmDialog';
import { productsService, type ProductItem } from '@/src/services/products.service';
import { ProductsFilterSection } from '@/src/components/Products/ProductsFilterSection';
import { AdminProductsList } from '@/src/components/Products/AdminProductsList';

export function AdminProductsPage() {
  const PAGE_SIZE = 10;

  const [products, setProducts] = useState<ProductItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<ProductStatus | 'all'>('all');
  const [availabilityFilter, setAvailabilityFilter] = useState<'all' | 'available' | 'unavailable'>('all');

  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, limit: PAGE_SIZE, total: 0, pages: 0 });

  const [deleteTarget, setDeleteTarget] = useState<ProductItem | null>(null);

  const loadProducts = useCallback(async (params?: { page?: number; search?: string }) => {
    const targetPage = params?.page ?? 1;
    const targetSearch = params?.search ?? '';

    setIsLoading(true);
    setError(null);

    try {
      const response = await productsService.getAllForAdmin({
        page: targetPage,
        limit: PAGE_SIZE,
        search: targetSearch,
      });

      setProducts(response.data);
      setPagination(response.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load products');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProducts({ page: 1, search: '' });
  }, [loadProducts]);

  const visibleProducts = useMemo(() => {
    return products.filter((item) => {
      const statusOk = statusFilter === 'all' || item.status === statusFilter;
      const availabilityOk =
        availabilityFilter === 'all' ||
        (availabilityFilter === 'available' && item.isAvailable) ||
        (availabilityFilter === 'unavailable' && !item.isAvailable);

      return statusOk && availabilityOk;
    });
  }, [products, statusFilter, availabilityFilter]);

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalizedSearch = searchQuery.trim();
    setPage(1);
    loadProducts({ page: 1, search: normalizedSearch });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;

    setIsDeleting(true);
    setError(null);

    try {
      await productsService.remove(deleteTarget.id);
      setDeleteTarget(null);

      const hasSingleRow = products.length === 1;
      const targetPage = hasSingleRow && page > 1 ? page - 1 : page;
      setPage(targetPage);
      await loadProducts({ page: targetPage, search: searchQuery.trim() });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete product');
    } finally {
      setIsDeleting(false);
    }
  };

  const handlePrevPage = () => {
    if (page <= 1) return;
    const nextPage = page - 1;
    setPage(nextPage);
    loadProducts({ page: nextPage, search: searchQuery.trim() });
  };

  const handleNextPage = () => {
    if (page >= pagination.pages) return;
    const nextPage = page + 1;
    setPage(nextPage);
    loadProducts({ page: nextPage, search: searchQuery.trim() });
  };

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand-ink">Products Management</h1>
        <p className="mt-1 text-sm text-brand-ink-soft">
          Review all products and manage catalog moderation from one place.
        </p>
      </div>

      <AppAlert message={error} />

      <ProductsFilterSection
        searchQuery={searchQuery}
        statusFilter={statusFilter}
        availabilityFilter={availabilityFilter}
        onSearchQueryChange={setSearchQuery}
        onStatusFilterChange={setStatusFilter}
        onAvailabilityFilterChange={setAvailabilityFilter}
        onSearchSubmit={handleSearch}
      />

      <div className="flex items-center justify-between text-sm text-brand-ink-soft">
        <span>
          Showing {visibleProducts.length} of {pagination.total} products
        </span>
        <span>
          Page {pagination.page} of {Math.max(1, pagination.pages)}
        </span>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-brand-rose" />
        </div>
      ) : visibleProducts.length === 0 ? (
        <div className="rounded-lg border border-dashed border-brand-line py-12 text-center text-brand-ink-soft">
          No products found
        </div>
      ) : (
        <AdminProductsList
          products={visibleProducts}
          onDeleteClick={setDeleteTarget}
        />
      )}

      {pagination.pages > 1 && (
        <div className="flex items-center justify-between border-t border-brand-line pt-4">
          <button
            type="button"
            onClick={handlePrevPage}
            disabled={page <= 1 || isLoading}
            className="rounded-lg border border-brand-line px-4 py-2 font-medium text-brand-ink transition hover:bg-brand-cream-soft disabled:cursor-not-allowed disabled:opacity-50"
          >
            Previous
          </button>
          <button
            type="button"
            onClick={handleNextPage}
            disabled={page >= pagination.pages || isLoading}
            className="rounded-lg bg-brand-rose px-4 py-2 font-medium text-white transition hover:bg-brand-rose/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}

      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        title="Delete Product"
        description={`Are you sure you want to delete ${deleteTarget?.name ?? 'this product'}? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        isConfirming={isDeleting}
        onConfirm={handleDeleteConfirm}
        onCancel={() => {
          if (!isDeleting) {
            setDeleteTarget(null);
          }
        }}
      />
    </section>
  );
}
