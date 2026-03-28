'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { RequestStatus } from '@shared-types';
import { Loader2, Plus } from 'lucide-react';
import { AppAlert } from '@/src/components/common/AppAlert';
import { requestsService, type RequestItem } from '@/src/services/requests.service';

const PAGE_SIZE = 10;

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

const statusLabel: Record<RequestStatus, string> = {
  [RequestStatus.OPEN]: 'OPEN',
  [RequestStatus.MATCHED]: 'MATCHED',
  [RequestStatus.CLOSED]: 'CLOSED',
  [RequestStatus.CANCELLED]: 'CANCELLED',
};

export function ClientRequestsPage() {
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: PAGE_SIZE,
    total: 0,
    pages: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadRequests = useCallback(async (page = 1) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await requestsService.getMine({ page, limit: PAGE_SIZE });
      setRequests(response.data);
      setPagination(response.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load requests');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadRequests(1);
  }, [loadRequests]);

  return (
    <section className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-brand-ink">My Custom Requests</h1>
          <p className="text-sm text-brand-ink-soft">
            Step 1: Submit your request. Professionals will send proposals for you to compare.
          </p>
        </div>

        <Link
          href="/client/requests/create"
          className="inline-flex items-center gap-2 rounded-lg bg-brand-rose px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-rose/90"
        >
          <Plus className="h-4 w-4" />
          Create Request
        </Link>
      </header>

      <AppAlert message={error} />

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-brand-ink">Your requests</h2>

        {isLoading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="h-8 w-8 animate-spin text-brand-rose" />
          </div>
        ) : requests.length === 0 ? (
          <div className="rounded-xl border border-dashed border-brand-line bg-white py-10 text-center text-sm text-brand-ink-soft">
            You have not submitted any custom requests yet.
          </div>
        ) : (
          <div className="space-y-3">
            {requests.map((request) => (
              <article key={request.id} className="rounded-xl border border-brand-line bg-white p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-sm font-semibold text-brand-ink">{request.title}</h3>
                  <span className="rounded-full bg-brand-cream-soft px-2.5 py-1 text-xs font-semibold text-brand-ink-soft">
                    {statusLabel[request.status]}
                  </span>
                </div>

                <p className="mt-1 text-sm text-brand-ink-soft">Due {formatDate(request.deliveryDateTime)} • Budget {formatCurrency(request.budget)}</p>

                <p className="mt-2 text-sm text-brand-ink-soft line-clamp-2">{request.description}</p>

                <div className="mt-3">
                  <Link
                    href={`/client/requests/${request.id}`}
                    className="rounded-lg border border-brand-line px-3 py-1.5 text-xs font-semibold text-brand-ink-soft transition hover:bg-brand-cream-soft hover:text-brand-ink"
                  >
                    View proposals and details
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {pagination.pages > 1 && (
        <div className="flex items-center justify-between border-t border-brand-line pt-4">
          <button
            type="button"
            onClick={() => void loadRequests(pagination.page - 1)}
            disabled={pagination.page <= 1 || isLoading}
            className="rounded-lg border border-brand-line px-4 py-2 text-sm font-medium text-brand-ink transition hover:bg-brand-cream-soft disabled:cursor-not-allowed disabled:opacity-50"
          >
            Previous
          </button>

          <span className="text-sm text-brand-ink-soft">Page {pagination.page} of {Math.max(1, pagination.pages)}</span>

          <button
            type="button"
            onClick={() => void loadRequests(pagination.page + 1)}
            disabled={pagination.page >= pagination.pages || isLoading}
            className="rounded-lg bg-brand-rose px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-rose/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </section>
  );
}
