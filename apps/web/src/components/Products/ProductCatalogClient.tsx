'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import { ProductStatus } from '@shared-types';
import { Loader2, Pencil, Plus, RefreshCcw, Trash2 } from 'lucide-react';
import { ProductCard } from '@/src/components/Products/ProductCard';
import { AppAlert } from '@/src/components/common/AppAlert';
import { ConfirmDialog } from '@/src/components/common/ConfirmDialog';
import { ProductsFilterSection } from '@/src/components/Products/ProductsFilterSection';
import { productsService, type ProductItem, type ProductsResponse } from '@/src/services/products.service';
import { categoriesService, type Category } from '@/src/services/categories.service';

type ProductCatalogScope = 'client' | 'professional';

type ProductCatalogClientProps = {
  scope: ProductCatalogScope;
  title: string;
  description: string;
  containerClassName: string;
  titleClassName: string;
  emptyStateClassName: string;
  gridClassName: string;
  searchPlaceholder: string;
  enableManagement?: boolean;
};

const PAGE_SIZE = 12;

const getProductsByScope = (scope: ProductCatalogScope, params: {
  page?: number;
  limit?: number;
  search?: string;
}): Promise<ProductsResponse> => {
  if (scope === 'professional') {
    return productsService.getAllForProfessional(params);
  }

  return productsService.getAllForClient(params);
};

export function ProductCatalogClient({
  scope,
  title,
  description,
  containerClassName,
  titleClassName,
  emptyStateClassName,
  gridClassName,
  searchPlaceholder,
  enableManagement = false,
}: ProductCatalogClientProps) {
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ProductStatus | 'all'>('all');
  const [availabilityFilter, setAvailabilityFilter] = useState<'all' | 'available' | 'unavailable'>('all');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: PAGE_SIZE,
    total: 0,
    pages: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [statusUpdatingId, setStatusUpdatingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ProductItem | null>(null);

  const [name, setName] = useState('');
  const [descriptionText, setDescriptionText] = useState('');
  const [price, setPrice] = useState('');
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [isAvailable, setIsAvailable] = useState(true);
  const [status, setStatus] = useState<ProductStatus>(ProductStatus.DRAFT);
  const [imageFile, setImageFile] = useState<File | null>(null);

  const loadProducts = useCallback(async (nextPage = 1, query = '') => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await getProductsByScope(scope, {
        page: nextPage,
        limit: PAGE_SIZE,
        search: query,
      });

      setProducts(response.data);
      setPagination(response.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load products');
    } finally {
      setIsLoading(false);
    }
  }, [scope]);

  useEffect(() => {
    void loadProducts(1, '');
  }, [loadProducts]);

  useEffect(() => {
    if (!enableManagement) return;

    const loadCategories = async () => {
      try {
        const response = await categoriesService.getAll();
        setCategories(response);
      } catch {
        setCategories([]);
      }
    };

    void loadCategories();
  }, [enableManagement]);

  const resetForm = () => {
    setEditingProduct(null);
    setName('');
    setDescriptionText('');
    setPrice('');
    setSelectedCategoryIds([]);
    setIsAvailable(true);
    setStatus(ProductStatus.DRAFT);
    setImageFile(null);
  };

  const openCreateForm = () => {
    resetForm();
    setIsFormOpen(true);
  };

  const openEditForm = (product: ProductItem) => {
    setEditingProduct(product);
    setName(product.name);
    setDescriptionText(product.description ?? '');
    setPrice(String(product.price));
    setSelectedCategoryIds(product.categoryIds ?? []);
    setIsAvailable(product.isAvailable);
    setStatus(product.status);
    setImageFile(null);
    setIsFormOpen(true);
  };

  const closeForm = () => {
    if (isSubmitting) return;
    setIsFormOpen(false);
    resetForm();
  };

  const toggleCategory = (id: string) => {
    setSelectedCategoryIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const handleSubmitProduct = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const normalizedName = name.trim();
    const normalizedPrice = Number(price);

    if (!normalizedName) {
      setError('Product name is required.');
      return;
    }

    if (!Number.isFinite(normalizedPrice) || normalizedPrice < 0) {
      setError('Price must be a valid non-negative number.');
      return;
    }

    if (selectedCategoryIds.length === 0) {
      setError('Please select at least one category.');
      return;
    }

    if (!editingProduct && !imageFile) {
      setError('Please upload a product image.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      if (editingProduct) {
        await productsService.update(editingProduct.id, {
          name: normalizedName,
          description: descriptionText.trim() || undefined,
          price: normalizedPrice,
          categoryIds: selectedCategoryIds,
          isAvailable,
          status,
          imageFile: imageFile ?? undefined,
        });
      } else {
        await productsService.create({
          name: normalizedName,
          description: descriptionText.trim() || undefined,
          price: normalizedPrice,
          categoryIds: selectedCategoryIds,
          isAvailable,
          status,
          imageFile: imageFile as File,
        });
      }

      closeForm();
      await loadProducts(1, search.trim());
      setPage(1);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save product');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (product: ProductItem) => {
    const nextStatus =
      product.status === ProductStatus.PUBLISHED
        ? ProductStatus.DRAFT
        : ProductStatus.PUBLISHED;

    setStatusUpdatingId(product.id);
    setError(null);

    try {
      await productsService.updateStatus(product.id, nextStatus);
      await loadProducts(page, search.trim());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update product status');
    } finally {
      setStatusUpdatingId(null);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;

    setIsDeleting(true);
    setError(null);

    try {
      await productsService.remove(deleteTarget.id);
      setDeleteTarget(null);

      const hasSingleRow = products.length === 1;
      const targetPage = hasSingleRow && page > 1 ? page - 1 : page;
      setPage(targetPage);
      await loadProducts(targetPage, search.trim());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete product');
    } finally {
      setIsDeleting(false);
    }
  };

  const onSubmitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const query = search.trim();
    setPage(1);
    void loadProducts(1, query);
  };

  const goToPage = (nextPage: number) => {
    if (nextPage < 1 || nextPage > pagination.pages) return;
    setPage(nextPage);
    void loadProducts(nextPage, search.trim());
  };

  return (
    <section className={containerClassName}>
      <header className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className={titleClassName}>{title}</h1>
          {enableManagement ? (
            <button
              type="button"
              onClick={openCreateForm}
              className="inline-flex items-center gap-2 rounded-lg bg-brand-rose px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-rose/90"
            >
              <Plus className="h-4 w-4" />
              New Product
            </button>
          ) : null}
        </div>
        <p className="text-sm text-brand-ink-soft">{description}</p>
      </header>

      <ProductsFilterSection
        searchQuery={search}
        statusFilter={statusFilter}
        availabilityFilter={availabilityFilter}
        searchPlaceholder={searchPlaceholder}
        showStatusFilter={false}
        showAvailabilityFilter={false}
        onSearchQueryChange={setSearch}
        onStatusFilterChange={setStatusFilter}
        onAvailabilityFilterChange={setAvailabilityFilter}
        onSearchSubmit={onSubmitSearch}
      />

      <AppAlert message={error} />

      {isLoading ? (
        <div className="flex items-center justify-center py-14">
          <Loader2 className="h-8 w-8 animate-spin text-brand-rose" />
        </div>
      ) : products.length === 0 ? (
        <div className={emptyStateClassName}>No products found.</div>
      ) : (
        <div className={gridClassName}>
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              actions={
                enableManagement ? (
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => openEditForm(product)}
                      className="inline-flex items-center gap-2 rounded-lg border border-brand-line px-3 py-1.5 text-xs font-semibold text-brand-ink-soft transition hover:bg-brand-cream-soft hover:text-brand-ink"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleToggleStatus(product)}
                      disabled={statusUpdatingId === product.id}
                      className="inline-flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700 transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <RefreshCcw className="h-3.5 w-3.5" />
                      {statusUpdatingId === product.id
                        ? 'Updating...'
                        : product.status === ProductStatus.PUBLISHED
                          ? 'Set Draft'
                          : 'Publish'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(product)}
                      className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 transition hover:bg-red-100"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Delete
                    </button>
                  </div>
                ) : undefined
              }
            />
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
            className="rounded-lg bg-brand-rose px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-rose/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}

      {enableManagement && isFormOpen ? (
        <div
          className="fixed inset-0 z-100 flex items-center justify-center bg-black/45 p-4"
          onClick={closeForm}
        >
          <div
            className="w-full max-w-2xl rounded-2xl border border-brand-line bg-white p-5 shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 className="text-lg font-semibold text-brand-ink">
              {editingProduct ? 'Update Product' : 'Create Product'}
            </h2>

            <form className="mt-4 space-y-4" onSubmit={handleSubmitProduct}>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-1 sm:col-span-2">
                  <span className="text-sm font-medium text-brand-ink">Name</span>
                  <input
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    className="w-full rounded-lg border border-brand-line px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-brand-rose focus:outline-none"
                    required
                  />
                </label>

                <label className="space-y-1 sm:col-span-2">
                  <span className="text-sm font-medium text-brand-ink">Description</span>
                  <textarea
                    value={descriptionText}
                    onChange={(event) => setDescriptionText(event.target.value)}
                    rows={3}
                    className="w-full rounded-lg border border-brand-line px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-brand-rose focus:outline-none"
                  />
                </label>

                <label className="space-y-1">
                  <span className="text-sm font-medium text-brand-ink">Price</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={price}
                    onChange={(event) => setPrice(event.target.value)}
                    className="w-full rounded-lg border border-brand-line px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-brand-rose focus:outline-none"
                    required
                  />
                </label>

                <label className="space-y-1">
                  <span className="text-sm font-medium text-brand-ink">Status</span>
                  <select
                    value={status}
                    onChange={(event) => setStatus(event.target.value as ProductStatus)}
                    className="w-full rounded-lg border border-brand-line px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-brand-rose focus:outline-none"
                  >
                    <option value={ProductStatus.DRAFT}>Draft</option>
                    <option value={ProductStatus.PUBLISHED}>Published</option>
                  </select>
                </label>

                <label className="space-y-1 sm:col-span-2">
                  <span className="text-sm font-medium text-brand-ink">
                    Product Image {editingProduct ? '(optional when updating)' : ''}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(event) => setImageFile(event.target.files?.[0] ?? null)}
                    className="w-full rounded-lg border border-brand-line px-3 py-2 text-sm"
                    required={!editingProduct}
                  />
                </label>

                <label className="flex items-center gap-2 sm:col-span-2">
                  <input
                    type="checkbox"
                    checked={isAvailable}
                    onChange={(event) => setIsAvailable(event.target.checked)}
                    className="h-4 w-4 rounded border-brand-line"
                  />
                  <span className="text-sm text-brand-ink">Available for orders</span>
                </label>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium text-brand-ink">Categories</p>
                {categories.length === 0 ? (
                  <p className="text-sm text-brand-ink-soft">No categories found.</p>
                ) : (
                  <div className="grid gap-2 sm:grid-cols-2">
                    {categories.map((category) => (
                      <label
                        key={category.id}
                        className="flex items-center gap-2 rounded-lg border border-brand-line px-3 py-2"
                      >
                        <input
                          type="checkbox"
                          checked={selectedCategoryIds.includes(category.id)}
                          onChange={() => toggleCategory(category.id)}
                          className="h-4 w-4 rounded border-brand-line"
                        />
                        <span className="text-sm text-brand-ink">{category.name}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={closeForm}
                  disabled={isSubmitting}
                  className="rounded-lg border border-brand-line px-4 py-2 text-sm font-semibold text-brand-ink-soft transition hover:bg-brand-cream-soft disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-lg bg-brand-rose px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-rose/90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSubmitting
                    ? editingProduct
                      ? 'Updating...'
                      : 'Creating...'
                    : editingProduct
                      ? 'Update Product'
                      : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        title="Delete Product"
        description={`Are you sure you want to delete ${deleteTarget?.name ?? 'this product'}? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        isConfirming={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          if (!isDeleting) {
            setDeleteTarget(null);
          }
        }}
      />
    </section>
  );
}
