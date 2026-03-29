'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { OrderStatus, OrderType } from '@shared-types';
import { Loader2, Truck, XCircle } from 'lucide-react';
import { z } from 'zod';
import { AppAlert } from '@/src/components/common/AppAlert';
import { ProfessionalFiltersBar } from '@/src/components/professional/ProfessionalFiltersBar';
import { ordersService, type OrderRecord } from '@/src/services/orders.service';

const searchSchema = z.object({
  query: z.string().trim().max(120, 'Search query must be 120 characters or less.'),
});

const statusFilterOptions = [
  { value: 'all', label: 'All statuses' },
  { value: OrderStatus.AWAITING_PAYMENT, label: 'Awaiting payment' },
  { value: OrderStatus.IN_PROGRESS, label: 'In progress' },
  { value: OrderStatus.READY, label: 'Ready' },
  { value: OrderStatus.COMPLETED, label: 'Completed' },
  { value: OrderStatus.CANCELLED, label: 'Cancelled' },
];

const createdSortOptions = [
  { value: 'newest', label: 'Newest first' },
  { value: 'oldest', label: 'Oldest first' },
] as const;

type CreatedSort = (typeof createdSortOptions)[number]['value'];

const formatDate = (value?: string) => {
  if (!value) return 'Not specified';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Not specified';

  return new Intl.DateTimeFormat('en-US', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
};

const formatCurrency = (value?: number) => {
  if (typeof value !== 'number') return 'Not set';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(value);
};

const productLabel = (productId: OrderRecord['items'][number]['productId']) => {
  if (typeof productId === 'string') {
    return 'Product';
  }

  return productId.name?.trim() || 'Product';
};

export function ProfessionalOrdersPage() {
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingOrderId, setLoadingOrderId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [searchError, setSearchError] = useState('');

  const [search, setSearch] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all');
  const [createdSort, setCreatedSort] = useState<CreatedSort>('newest');

  const loadOrders = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await ordersService.getForProfessional({
        page: 1,
        limit: 50,
      });
      setOrders(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load orders');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadOrders();
  }, [loadOrders]);

  const filteredOrders = useMemo(() => {
    const normalizedSearch = appliedSearch.toLowerCase();

    const filtered = orders.filter((order) => {
      if (statusFilter !== 'all' && order.status !== statusFilter) {
        return false;
      }

      if (!normalizedSearch) {
        return true;
      }

      const haystack = [
        `Order ${order.id.slice(-6).toUpperCase()}`,
        order.items.map((item) => productLabel(item.productId)).join(' '),
        order.status,
      ]
        .join(' ')
        .toLowerCase();

      return haystack.includes(normalizedSearch);
    });

    filtered.sort((left, right) => {
      const leftTime = left.createdAt ? new Date(left.createdAt).getTime() : 0;
      const rightTime = right.createdAt ? new Date(right.createdAt).getTime() : 0;
      const safeLeft = Number.isNaN(leftTime) ? 0 : leftTime;
      const safeRight = Number.isNaN(rightTime) ? 0 : rightTime;

      return createdSort === 'newest' ? safeRight - safeLeft : safeLeft - safeRight;
    });

    return filtered;
  }, [appliedSearch, createdSort, orders, statusFilter]);

  const onSubmitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const parsed = searchSchema.safeParse({ query: search });
    if (!parsed.success) {
      setSearchError(parsed.error.issues[0]?.message ?? 'Invalid search query.');
      return;
    }

    setSearchError('');
    setAppliedSearch(parsed.data.query);
  };

  const handleOrderAction = async (
    orderId: string,
    action: (id: string) => Promise<unknown>,
    successMessage: string,
  ) => {
    setLoadingOrderId(orderId);
    setError(null);
    setSuccess(null);

    try {
      await action(orderId);
      setSuccess(successMessage);
      await loadOrders();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update order');
    } finally {
      setLoadingOrderId(null);
    }
  };

  return (
    <section className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold text-brand-ink">Orders</h1>
        <p className="text-sm text-brand-ink-soft">Manage direct and custom request orders from one place.</p>
      </header>

      <ProfessionalFiltersBar
        searchQuery={search}
        searchError={searchError}
        searchPlaceholder="Search by order id or product"
        onSearchQueryChange={(value) => {
          setSearch(value);
          if (searchError) {
            setSearchError('');
          }
        }}
        onSearchSubmit={onSubmitSearch}
        primaryFilterLabel="Order status"
        primaryFilterValue={statusFilter}
        primaryFilterOptions={statusFilterOptions}
        onPrimaryFilterChange={(value) => setStatusFilter(value as OrderStatus | 'all')}
        secondaryFilterLabel="Created"
        secondaryFilterValue={createdSort}
        secondaryFilterOptions={[...createdSortOptions]}
        onSecondaryFilterChange={(value) => setCreatedSort(value as CreatedSort)}
      />

      <AppAlert message={error} />
      <AppAlert message={success} variant="success" />

      {isLoading ? (
        <div className="flex items-center justify-center py-10">
          <Loader2 className="h-8 w-8 animate-spin text-brand-rose" />
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="rounded-xl border border-dashed border-brand-line bg-white py-10 text-center text-sm text-brand-ink-soft">
          No matching orders found.
        </div>
      ) : (
        <div className="space-y-3">
          {filteredOrders.map((order) => {
            const isUpdating = loadingOrderId === order.id;
            const canMarkReady = order.status === OrderStatus.IN_PROGRESS;
            const canReject =
              order.type === OrderType.DIRECT &&
              (order.status === OrderStatus.AWAITING_PAYMENT ||
                order.status === OrderStatus.IN_PROGRESS);

            return (
              <article key={order.id} className="rounded-xl border border-brand-line bg-white p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h2 className="text-sm font-semibold text-brand-ink">Order #{order.id.slice(-6).toUpperCase()}</h2>
                    <p className="text-xs text-brand-ink-soft">
                      {order.type === OrderType.DIRECT ? 'Direct order' : 'Custom request'} • {formatDate(order.createdAt)}
                    </p>
                  </div>
                  <span className="rounded-full bg-brand-cream-soft px-2.5 py-1 text-xs font-semibold text-brand-ink-soft">
                    {order.status.replaceAll('_', ' ')}
                  </span>
                </div>

                <div className="mt-2 space-y-1">
                  {order.items.map((item, index) => (
                    <p key={`${order.id}-item-${index}`} className="text-sm text-brand-ink-soft">
                      {item.quantity} x {productLabel(item.productId)}
                    </p>
                  ))}
                </div>

                <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-brand-ink">Total: {formatCurrency(order.totalPrice)}</p>

                  <div className="flex flex-wrap gap-2">
                    {canMarkReady ? (
                      <button
                        type="button"
                        onClick={() =>
                          void handleOrderAction(
                            order.id,
                            ordersService.markReady,
                            'Order marked as READY.',
                          )
                        }
                        disabled={isUpdating}
                        className="inline-flex items-center gap-2 rounded-lg bg-brand-sage px-3 py-1.5 text-xs font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <Truck className="h-3.5 w-3.5" />
                        {isUpdating ? 'Updating...' : 'Mark READY'}
                      </button>
                    ) : null}

                    {canReject ? (
                      <button
                        type="button"
                        onClick={() =>
                          void handleOrderAction(
                            order.id,
                            ordersService.reject,
                            'Order rejected and cancelled.',
                          )
                        }
                        disabled={isUpdating}
                        className="inline-flex items-center gap-2 rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <XCircle className="h-3.5 w-3.5" />
                        {isUpdating ? 'Updating...' : 'Reject'}
                      </button>
                    ) : null}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
