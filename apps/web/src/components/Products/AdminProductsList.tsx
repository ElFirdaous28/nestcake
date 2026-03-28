'use client';

import { ProductStatus } from '@shared-types';
import { Trash2 } from 'lucide-react';
import { type ProductItem } from '@/src/services/products.service';

type AdminProductsListProps = {
  products: ProductItem[];
  onDeleteClick: (product: ProductItem) => void;
};

const statusBadgeClass: Record<ProductStatus, string> = {
  [ProductStatus.DRAFT]: 'bg-amber-100 text-amber-700',
  [ProductStatus.PUBLISHED]: 'bg-emerald-100 text-emerald-700',
};

const prettyLabel = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);

export function AdminProductsList({ products, onDeleteClick }: AdminProductsListProps) {
  return (
    <div className="overflow-hidden rounded-lg border border-brand-line">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-brand-line bg-brand-cream/30">
              <th className="px-6 py-3 text-left text-sm font-semibold text-brand-ink">Name</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-brand-ink">Price</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-brand-ink">Status</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-brand-ink">Available</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-brand-ink">Created</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-brand-ink">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-line">
            {products.map((product) => (
              <tr key={product.id} className="transition hover:bg-brand-cream/20">
                <td className="px-6 py-4">
                  <p className="text-sm font-medium text-brand-ink">{product.name}</p>
                  {product.description && (
                    <p className="mt-1 max-w-md truncate text-xs text-brand-ink-soft">{product.description}</p>
                  )}
                </td>
                <td className="px-6 py-4 text-sm text-brand-ink">${product.price.toFixed(2)}</td>
                <td className="px-6 py-4 text-sm">
                  <span
                    className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${statusBadgeClass[product.status]}`}
                  >
                    {prettyLabel(product.status)}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-brand-ink">{product.isAvailable ? 'Yes' : 'No'}</td>
                <td className="px-6 py-4 text-sm text-brand-ink-soft">
                  {product.createdAt ? new Date(product.createdAt).toLocaleDateString() : '-'}
                </td>
                <td className="px-6 py-4 text-sm">
                  <button
                    type="button"
                    onClick={() => onDeleteClick(product)}
                    className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-red-700 transition hover:bg-red-100"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
