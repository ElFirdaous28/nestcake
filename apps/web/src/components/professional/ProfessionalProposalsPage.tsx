'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { OrderStatus, ProposalStatus } from '@shared-types';
import { Loader2, Truck } from 'lucide-react';
import { z } from 'zod';
import { AppAlert } from '@/src/components/common/AppAlert';
import { ProfessionalFiltersBar } from '@/src/components/professional/ProfessionalFiltersBar';
import { ordersService, type OrderRecord } from '@/src/services/orders.service';
import { proposalsService, type ProposalItem } from '@/src/services/proposals.service';

const searchSchema = z.object({
  query: z.string().trim().max(120, 'Search query must be 120 characters or less.'),
});

const proposalStatusOptions = [
  { value: 'all', label: 'All statuses' },
  { value: ProposalStatus.PENDING, label: 'Pending' },
  { value: ProposalStatus.ACCEPTED, label: 'Accepted' },
  { value: ProposalStatus.REJECTED, label: 'Rejected' },
  { value: ProposalStatus.WITHDRAWN, label: 'Withdrawn' },
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

const requestTitle = (proposal: ProposalItem) => {
  if (typeof proposal.requestId === 'string') {
    return `Request #${proposal.requestId.slice(-6).toUpperCase()}`;
  }

  return proposal.requestId.title?.trim() || 'Request';
};

const requestDescription = (proposal: ProposalItem) => {
  if (typeof proposal.requestId === 'string') {
    return '';
  }

  return proposal.requestId.description?.trim() || '';
};

export function ProfessionalProposalsPage() {
  const [proposals, setProposals] = useState<ProposalItem[]>([]);
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingOrderId, setLoadingOrderId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [searchError, setSearchError] = useState('');

  const [search, setSearch] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ProposalStatus | 'all'>('all');
  const [createdSort, setCreatedSort] = useState<CreatedSort>('newest');

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [proposalsData, ordersResponse] = await Promise.all([
        proposalsService.getMy(),
        ordersService.getForProfessional({ page: 1, limit: 50 }),
      ]);

      setProposals(proposalsData);
      setOrders(ordersResponse.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load proposals');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const filteredProposals = useMemo(() => {
    const normalizedSearch = appliedSearch.toLowerCase();

    const filtered = proposals.filter((proposal) => {
      if (statusFilter !== 'all' && proposal.status !== statusFilter) {
        return false;
      }

      if (!normalizedSearch) {
        return true;
      }

      const haystack = [
        requestTitle(proposal),
        requestDescription(proposal),
        proposal.message ?? '',
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
  }, [appliedSearch, createdSort, proposals, statusFilter]);

  const inProgressOrders = useMemo(
    () => orders.filter((order) => order.status === OrderStatus.IN_PROGRESS),
    [orders],
  );

  const readyOrders = useMemo(
    () => orders.filter((order) => order.status === OrderStatus.READY),
    [orders],
  );

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

  const handleMarkReady = async (orderId: string) => {
    setLoadingOrderId(orderId);
    setError(null);
    setSuccess(null);

    try {
      await ordersService.markReady(orderId);
      setSuccess('Order marked as READY. Client can now confirm reception.');
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update order status');
    } finally {
      setLoadingOrderId(null);
    }
  };

  return (
    <section className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold text-brand-ink">My Proposals</h1>
        <p className="text-sm text-brand-ink-soft">Track proposal outcomes and manage paid orders awaiting READY.</p>
      </header>

      <ProfessionalFiltersBar
        searchQuery={search}
        searchError={searchError}
        searchPlaceholder="Search by request title, description, or message"
        onSearchQueryChange={(value) => {
          setSearch(value);
          if (searchError) {
            setSearchError('');
          }
        }}
        onSearchSubmit={onSubmitSearch}
        primaryFilterLabel="Proposal status"
        primaryFilterValue={statusFilter}
        primaryFilterOptions={proposalStatusOptions}
        onPrimaryFilterChange={(value) => setStatusFilter(value as ProposalStatus | 'all')}
        secondaryFilterLabel="Created"
        secondaryFilterValue={createdSort}
        secondaryFilterOptions={[...createdSortOptions]}
        onSecondaryFilterChange={(value) => setCreatedSort(value as CreatedSort)}
      />

      <AppAlert message={error} />
      <AppAlert message={success} variant="success" />

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-brand-ink">Proposals</h2>

        {isLoading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="h-8 w-8 animate-spin text-brand-rose" />
          </div>
        ) : filteredProposals.length === 0 ? (
          <div className="rounded-xl border border-dashed border-brand-line bg-white py-10 text-center text-sm text-brand-ink-soft">
            No matching proposals found.
          </div>
        ) : (
          <div className="space-y-3">
            {filteredProposals.map((proposal) => (
              <article key={proposal.id} className="rounded-xl border border-brand-line bg-white p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-sm font-semibold text-brand-ink">{requestTitle(proposal)}</h3>
                  <span className="rounded-full bg-brand-cream-soft px-2.5 py-1 text-xs font-semibold text-brand-ink-soft">
                    {proposal.status}
                  </span>
                </div>

                <p className="mt-1 text-sm font-semibold text-brand-ink">Offer: {formatCurrency(proposal.price)}</p>
                <p className="mt-1 text-xs text-brand-ink-soft">Delivery: {formatDate(proposal.deliveryDateTime)}</p>

                {requestDescription(proposal) ? (
                  <p className="mt-2 text-sm text-brand-ink-soft line-clamp-2">{requestDescription(proposal)}</p>
                ) : null}

                <p className="mt-2 text-sm text-brand-ink-soft">{proposal.message?.trim() || 'No additional message.'}</p>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-brand-ink">Orders Awaiting READY</h2>

        {inProgressOrders.length === 0 ? (
          <div className="rounded-xl border border-dashed border-brand-line bg-white py-10 text-center text-sm text-brand-ink-soft">
            No in-progress paid orders right now.
          </div>
        ) : (
          <div className="space-y-3">
            {inProgressOrders.map((order) => {
              const isUpdating = loadingOrderId === order.id;

              return (
                <article key={order.id} className="rounded-xl border border-brand-line bg-white p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h3 className="text-sm font-semibold text-brand-ink">Order #{order.id.slice(-6).toUpperCase()}</h3>
                      <p className="text-xs text-brand-ink-soft">Paid in escrow • currently in progress</p>
                    </div>
                    <span className="text-sm font-semibold text-brand-ink">{formatCurrency(order.totalPrice)}</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => void handleMarkReady(order.id)}
                    disabled={isUpdating}
                    className="mt-3 inline-flex items-center gap-2 rounded-lg bg-brand-sage px-3 py-1.5 text-xs font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Truck className="h-3.5 w-3.5" />
                    {isUpdating ? 'Updating...' : 'Mark READY'}
                  </button>
                </article>
              );
            })}
          </div>
        )}

        {readyOrders.length > 0 ? (
          <p className="text-xs text-brand-ink-soft">{readyOrders.length} order(s) already marked READY and waiting for client confirmation.</p>
        ) : null}
      </section>
    </section>
  );
}
