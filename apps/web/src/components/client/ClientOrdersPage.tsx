'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import { OrderStatus, OrderType } from '@shared-types';
import { Loader2, Star } from 'lucide-react';
import { z } from 'zod';
import { AppAlert } from '@/src/components/common/AppAlert';
import { ordersService, type OrderRecord } from '@/src/services/orders.service';
import { reviewsService } from '@/src/services/reviews.service';

const PAGE_SIZE = 10;

const reviewFormSchema = z.object({
  orderId: z.string().trim().min(1, 'Order id is required'),
  rating: z.number().int().min(1, 'Rating must be at least 1').max(5, 'Rating cannot exceed 5'),
  comment: z.string().trim().max(1000, 'Comment must be 1000 characters or less').optional(),
});

const orderStatusOptions: { value: OrderStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All statuses' },
  { value: OrderStatus.AWAITING_PAYMENT, label: 'Awaiting payment' },
  { value: OrderStatus.IN_PROGRESS, label: 'In progress' },
  { value: OrderStatus.READY, label: 'Ready' },
  { value: OrderStatus.COMPLETED, label: 'Completed' },
  { value: OrderStatus.CANCELLED, label: 'Cancelled' },
];

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(value);

const formatDate = (value?: string) => {
  if (!value) {
    return 'Unknown date';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'Unknown date';
  }

  return new Intl.DateTimeFormat('en-US', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
};

const professionalName = (order: OrderRecord) => {
  if (typeof order.professionalId === 'string') {
    return 'Professional';
  }

  return order.professionalId.businessName?.trim() || 'Professional';
};

const productLabel = (productId: OrderRecord['items'][number]['productId']) => {
  if (typeof productId === 'string') {
    return 'Product';
  }

  return productId.name?.trim() || 'Product';
};

const productIdValue = (productId: OrderRecord['items'][number]['productId']) => {
  if (typeof productId === 'string') {
    return productId;
  }

  return productId._id;
};

const workflowHintByStatus: Record<OrderStatus, string> = {
  [OrderStatus.AWAITING_PAYMENT]: 'Step 4: Pay 100% into escrow to start production.',
  [OrderStatus.IN_PROGRESS]: 'Step 5: Professional is preparing your order.',
  [OrderStatus.READY]: 'Step 6: Confirm reception to release payment to the professional.',
  [OrderStatus.COMPLETED]: 'Completed. Optional: leave a review, we will keep reminding you.',
  [OrderStatus.CANCELLED]: 'This order was cancelled.',
};

export function ClientOrdersPage() {
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: PAGE_SIZE,
    total: 0,
    pages: 0,
  });
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all');
  const [loadingOrderId, setLoadingOrderId] = useState<string | null>(null);
  const [loadingItemKey, setLoadingItemKey] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reviewOrder, setReviewOrder] = useState<OrderRecord | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [isReviewSubmitting, setIsReviewSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reviewFieldErrors, setReviewFieldErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState<string | null>(null);

  const loadOrders = useCallback(
    async (page = 1, status: OrderStatus | 'all' = statusFilter) => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await ordersService.getForClient({
          page,
          limit: PAGE_SIZE,
          status: status === 'all' ? undefined : status,
        });

        setOrders(response.data);
        setPagination(response.pagination);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load your orders');
      } finally {
        setIsLoading(false);
      }
    },
    [statusFilter],
  );

  useEffect(() => {
    void loadOrders(1, statusFilter);
  }, [loadOrders, statusFilter]);

  const runOrderAction = async (
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
      await loadOrders(pagination.page, statusFilter);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Order action failed');
    } finally {
      setLoadingOrderId(null);
    }
  };

  const openReviewModal = (order: OrderRecord) => {
    setReviewOrder(order);
    setRating(5);
    setComment('');
    setError(null);
    setIsReviewModalOpen(true);
  };

  const closeReviewModal = () => {
    if (isReviewSubmitting) {
      return;
    }

    setIsReviewModalOpen(false);
    setReviewOrder(null);
  };

  const handleRemoveItem = async (orderId: string, productId: string) => {
    const itemKey = `${orderId}:${productId}`;
    setLoadingItemKey(itemKey);
    setError(null);
    setSuccess(null);

    try {
      await ordersService.removeItem(orderId, productId);
      setSuccess('Item removed from order.');
      await loadOrders(pagination.page, statusFilter);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove item');
    } finally {
      setLoadingItemKey(null);
    }
  };

  const handleSubmitReview = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!reviewOrder) {
      return;
    }

    const parsed = reviewFormSchema.safeParse({
      orderId: reviewOrder.id,
      rating,
      comment,
    });

    if (!parsed.success) {
      const errors = parsed.error.issues.reduce<Record<string, string>>((acc, issue) => {
        const path = issue.path[0];
        if (typeof path === 'string' && !acc[path]) {
          acc[path] = issue.message;
        }
        return acc;
      }, {});
      setReviewFieldErrors(errors);
      return;
    }

    setReviewFieldErrors({});

    const values = parsed.data;

    setIsReviewSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      await reviewsService.create({
        orderId: values.orderId,
        rating: values.rating,
        comment: values.comment || undefined,
      });

      setSuccess('Review submitted successfully.');
      closeReviewModal();
      await loadOrders(pagination.page, statusFilter);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit review');
    } finally {
      setIsReviewSubmitting(false);
    }
  };

  return (
    <section className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold text-brand-ink">My Orders</h1>
        <p className="text-sm text-brand-ink-soft">Track escrow payment, production, delivery readiness, and completion.</p>
      </header>

      <AppAlert message={error} />
      <AppAlert message={success} variant="success" />

      <article className="rounded-xl border border-brand-line bg-brand-cream-soft p-4 text-sm text-brand-ink-soft">
        <p className="font-semibold text-brand-ink">Workflow steps</p>
        <p className="mt-1">
          1) Accept proposal creates order, 2) Pay 100% escrow, 3) Professional marks READY, 4) Confirm reception to release payment.
        </p>
      </article>

      <div className="rounded-xl border border-brand-line bg-brand-cream-soft p-4">
        <label className="space-y-1">
          <span className="text-sm font-medium text-brand-ink">Filter by status</span>
          <select
            value={statusFilter}
            onChange={(event) => {
              setStatusFilter(event.target.value as OrderStatus | 'all');
              setPagination((prev) => ({ ...prev, page: 1 }));
            }}
            className="w-full max-w-xs rounded-lg border border-brand-line bg-white px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-brand-rose focus:outline-none"
          >
            {orderStatusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-brand-rose" />
        </div>
      ) : orders.length === 0 ? (
        <div className="rounded-xl border border-dashed border-brand-line bg-brand-cream-soft py-10 text-center text-sm text-brand-ink-soft">
          No orders found for this filter.
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const isRowLoading = loadingOrderId === order.id;
            const canPay = order.status === OrderStatus.AWAITING_PAYMENT;
            const canComplete = order.status === OrderStatus.READY;
            const canReview = order.status === OrderStatus.COMPLETED;
            const canCancelOrder = order.status === OrderStatus.AWAITING_PAYMENT;
            const canRemoveItems =
              order.status === OrderStatus.AWAITING_PAYMENT &&
              order.type === OrderType.DIRECT;

            return (
              <article key={order.id} className="rounded-xl border border-brand-line bg-white p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h2 className="text-sm font-semibold text-brand-ink">{professionalName(order)}</h2>
                    <p className="text-xs text-brand-ink-soft">{formatDate(order.createdAt)}</p>
                  </div>

                  <span className="rounded-full bg-brand-cream-soft px-2.5 py-1 text-xs font-semibold text-brand-ink-soft">
                    {order.status.replaceAll('_', ' ')}
                  </span>
                </div>

                <div className="mt-3 space-y-2">
                  {order.items.map((item, index) => {
                    const currentProductId = productIdValue(item.productId);
                    const isRemovingItem =
                      loadingItemKey === `${order.id}:${currentProductId}`;

                    return (
                      <div key={`${order.id}-item-${index}`} className="flex items-center justify-between gap-2">
                        <p className="text-sm text-brand-ink-soft">
                          {item.quantity} x {productLabel(item.productId)}
                        </p>

                        {canRemoveItems ? (
                          <button
                            type="button"
                            onClick={() =>
                              void handleRemoveItem(order.id, currentProductId)
                            }
                            disabled={isRemovingItem || isRowLoading}
                            className="rounded-lg border border-brand-line px-2.5 py-1 text-xs font-semibold text-brand-ink-soft transition hover:bg-brand-cream-soft disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {isRemovingItem ? 'Removing...' : 'Remove item'}
                          </button>
                        ) : null}
                      </div>
                    );
                  })}
                </div>

                <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-brand-ink">Total: {formatCurrency(order.totalPrice)}</p>

                  <div className="flex flex-wrap gap-2">
                    {canPay ? (
                      <button
                        type="button"
                        onClick={() =>
                          void runOrderAction(
                            order.id,
                            ordersService.markPaid,
                            'Escrow payment received. Order is now IN_PROGRESS.',
                          )
                        }
                        disabled={isRowLoading}
                        className="rounded-lg border border-brand-line px-3 py-1.5 text-xs font-semibold text-brand-ink-soft transition hover:bg-brand-cream-soft disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {isRowLoading ? 'Processing...' : 'Pay 100% (Escrow)'}
                      </button>
                    ) : null}

                    {canComplete ? (
                      <button
                        type="button"
                        onClick={() =>
                          void runOrderAction(
                            order.id,
                            ordersService.markCompleted,
                            'Reception confirmed. Payment released and order completed.',
                          )
                        }
                        disabled={isRowLoading}
                        className="rounded-lg bg-brand-sage px-3 py-1.5 text-xs font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {isRowLoading ? 'Processing...' : 'Confirm Reception'}
                      </button>
                    ) : null}

                    {canReview ? (
                      <button
                        type="button"
                        onClick={() => openReviewModal(order)}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-brand-rose px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-brand-rose/90"
                      >
                        <Star className="h-3.5 w-3.5" />
                        Leave Review (Optional)
                      </button>
                    ) : null}

                    {canCancelOrder ? (
                      <button
                        type="button"
                        onClick={() =>
                          void runOrderAction(
                            order.id,
                            ordersService.remove,
                            'Order cancelled successfully.',
                          )
                        }
                        disabled={isRowLoading}
                        className="rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {isRowLoading ? 'Cancelling...' : 'Cancel Order'}
                      </button>
                    ) : null}
                  </div>
                </div>

                <p className="mt-2 text-xs text-brand-ink-soft">{workflowHintByStatus[order.status]}</p>
              </article>
            );
          })}
        </div>
      )}

      {pagination.pages > 1 && (
        <div className="flex items-center justify-between border-t border-brand-line pt-4">
          <button
            type="button"
            onClick={() => void loadOrders(pagination.page - 1, statusFilter)}
            disabled={pagination.page <= 1 || isLoading}
            className="rounded-lg border border-brand-line px-4 py-2 text-sm font-medium text-brand-ink transition hover:bg-brand-cream-soft disabled:cursor-not-allowed disabled:opacity-50"
          >
            Previous
          </button>

          <span className="text-sm text-brand-ink-soft">
            Page {pagination.page} of {Math.max(1, pagination.pages)}
          </span>

          <button
            type="button"
            onClick={() => void loadOrders(pagination.page + 1, statusFilter)}
            disabled={pagination.page >= pagination.pages || isLoading}
            className="rounded-lg bg-brand-rose px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-rose/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}

      {isReviewModalOpen ? (
        <div
          className="fixed inset-0 z-100 flex items-center justify-center bg-black/45 p-4"
          onClick={closeReviewModal}
        >
          <div
            className="w-full max-w-lg rounded-2xl border border-brand-line bg-white p-5 shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 className="text-lg font-semibold text-brand-ink">Leave Review</h2>
            <p className="mt-1 text-sm text-brand-ink-soft">
              Share your feedback for {reviewOrder ? professionalName(reviewOrder) : 'this professional'}.
            </p>

            <form className="mt-4 space-y-4" onSubmit={handleSubmitReview}>
              <label className="space-y-1">
                <span className="text-sm font-medium text-brand-ink">Rating</span>
                <select
                  value={rating}
                  onChange={(event) => {
                    setRating(Number(event.target.value));
                    setReviewFieldErrors((prev) => ({ ...prev, rating: '' }));
                  }}
                  className="w-full rounded-lg border border-brand-line px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-brand-rose focus:outline-none"
                >
                  {[5, 4, 3, 2, 1].map((value) => (
                    <option key={value} value={value}>
                      {value} star{value > 1 ? 's' : ''}
                    </option>
                  ))}
                </select>
                {reviewFieldErrors.rating ? <p className="text-xs text-brand-danger">{reviewFieldErrors.rating}</p> : null}
              </label>

              <label className="space-y-1">
                <span className="text-sm font-medium text-brand-ink">Comment (optional)</span>
                <textarea
                  value={comment}
                  onChange={(event) => {
                    setComment(event.target.value);
                    setReviewFieldErrors((prev) => ({ ...prev, comment: '' }));
                  }}
                  rows={4}
                  maxLength={1000}
                  className="w-full rounded-lg border border-brand-line px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-brand-rose focus:outline-none"
                />
                {reviewFieldErrors.comment ? <p className="text-xs text-brand-danger">{reviewFieldErrors.comment}</p> : null}
              </label>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={closeReviewModal}
                  disabled={isReviewSubmitting}
                  className="rounded-lg border border-brand-line px-4 py-2 text-sm font-semibold text-brand-ink-soft transition hover:bg-brand-cream-soft disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isReviewSubmitting}
                  className="rounded-lg bg-brand-rose px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-rose/90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isReviewSubmitting ? 'Submitting...' : 'Submit review'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </section>
  );
}
