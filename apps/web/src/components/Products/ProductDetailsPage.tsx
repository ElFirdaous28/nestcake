'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { AppAlert } from '@/src/components/common/AppAlert';
import { productsService, type ProductItem } from '@/src/services/products.service';

type ProductDetailsPageProps = {
  productId: string;
};

export function ProductDetailsPage({ productId }: ProductDetailsPageProps) {
  const [product, setProduct] = useState<ProductItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadProduct = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await productsService.getById(productId);
        setProduct(response);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load product details');
      } finally {
        setIsLoading(false);
      }
    };

    void loadProduct();
  }, [productId]);

  if (isLoading) {
    return (
      <main className="min-h-screen bg-brand-cream px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-5xl items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-brand-rose" />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-brand-cream px-4 py-8 sm:px-6 lg:px-8">
      <section className="mx-auto max-w-5xl space-y-4">
        <Link href="/products" className="inline-flex text-sm font-medium text-brand-ink-soft hover:text-brand-ink">
          Back to products
        </Link>

        <AppAlert message={error} />

        {!product ? (
          <div className="rounded-xl border border-dashed border-brand-line bg-white py-14 text-center text-brand-ink-soft">
            Product not found.
          </div>
        ) : (
          <article className="grid overflow-hidden rounded-2xl border border-brand-line bg-white shadow-sm lg:grid-cols-2">
            <img src={product.image} alt={product.name} className="h-full min-h-80 w-full object-cover" />

            <div className="space-y-5 p-6">
              <header className="space-y-2">
                <h1 className="text-3xl font-bold text-brand-ink">{product.name}</h1>
                <p className="text-lg font-semibold text-brand-ink">${product.price.toFixed(2)}</p>
              </header>

              <p className="text-sm leading-6 text-brand-ink-soft">
                {product.description?.trim() || 'No description available for this product yet.'}
              </p>

              <div className="flex flex-wrap gap-2">
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    product.isAvailable
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-rose-100 text-rose-700'
                  }`}
                >
                  {product.isAvailable ? 'Available' : 'Unavailable'}
                </span>
                <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                  {product.status}
                </span>
              </div>
            </div>
          </article>
        )}
      </section>
    </main>
  );
}
