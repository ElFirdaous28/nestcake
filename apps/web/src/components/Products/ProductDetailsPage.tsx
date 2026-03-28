'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { OrderStatus, ProductStatus, UserRole } from '@shared-types';
import { Loader2 } from 'lucide-react';
import { z } from 'zod';
import { AppAlert } from '@/src/components/common/AppAlert';
import { useAuth } from '@/src/hooks/useAuth';
import { ordersService } from '@/src/services/orders.service';
import { productsService, type ProductItem } from '@/src/services/products.service';

type ProductDetailsPageProps = {
  productId: string;
};

const directOrderSchema = z.object({
  productId: z.string().trim().min(1, 'Product id is required.'),
  quantity: z.coerce.number().int().min(1, 'Quantity must be at least 1.').max(50, 'Quantity cannot exceed 50.'),
});

export function ProductDetailsPage({ productId }: ProductDetailsPageProps) {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const [product, setProduct] = useState<ProductItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [quantity, setQuantity] = useState('1');
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const isClient = user?.role === UserRole.CLIENT;

  const createDirectOrder = async () => {
    if (!product) {
      return;
    }

    if (!isAuthenticated) {
      router.push(`/login?next=${encodeURIComponent(`/products/${product.id}`)}`);
      return;
    }

    if (!isClient) {
      setError('Only clients can place direct orders.');
      return;
    }

    const parsed = directOrderSchema.safeParse({
      productId: product.id,
      quantity,
    });

    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Please check quantity and try again.');
      return;
    }

    setIsCreatingOrder(true);
    setError(null);
    setSuccess(null);

    try {
      const createdOrder = await ordersService.create({
        items: [
          {
            productId: parsed.data.productId,
            quantity: parsed.data.quantity,
          },
        ],
      });

      if (createdOrder.status !== OrderStatus.AWAITING_PAYMENT) {
        setSuccess('Order placed successfully.');
        return;
      }

      setSuccess('Direct order created. Please complete payment from your Orders page.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create direct order');
    } finally {
      setIsCreatingOrder(false);
    }
  };

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
        <AppAlert message={success} variant="success" />

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

              <div className="space-y-3 rounded-xl border border-brand-line bg-brand-cream-soft p-4">
                <p className="text-sm font-semibold text-brand-ink">Direct order</p>

                <label className="block space-y-1">
                  <span className="text-xs font-semibold uppercase tracking-widest text-brand-ink-soft">Quantity</span>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    step="1"
                    value={quantity}
                    onChange={(event) => setQuantity(event.target.value)}
                    className="w-full max-w-28 rounded-lg border border-brand-line px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-brand-rose focus:outline-none"
                  />
                </label>

                {!isAuthLoading && !isAuthenticated ? (
                  <p className="text-xs text-brand-ink-soft">Sign in as a client to place a direct order.</p>
                ) : null}

                {!isAuthLoading && isAuthenticated && !isClient ? (
                  <p className="text-xs text-brand-ink-soft">Only client accounts can place direct orders.</p>
                ) : null}

                <button
                  type="button"
                  onClick={() => void createDirectOrder()}
                  disabled={isCreatingOrder || isAuthLoading || !product.isAvailable || product.status !== ProductStatus.PUBLISHED || (isAuthenticated && !isClient)}
                  className="rounded-lg bg-brand-rose px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-rose/90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isCreatingOrder ? 'Creating order...' : 'Order Now'}
                </button>
              </div>
            </div>
          </article>
        )}

      </section>
    </main>
  );
}
