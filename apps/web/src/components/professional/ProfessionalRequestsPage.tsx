'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { DeliveryType } from '@shared-types';
import { Loader2, Send } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { AppAlert } from '@/src/components/common/AppAlert';
import { ProfessionalFiltersBar } from '@/src/components/professional/ProfessionalFiltersBar';
import { proposalsService } from '@/src/services/proposals.service';
import { requestsService, type RequestItem } from '@/src/services/requests.service';

const searchSchema = z.object({
  query: z.string().trim().max(120, 'Search query must be 120 characters or less.'),
});

const proposalFormSchema = z.object({
  requestId: z.string().trim().min(1, 'Request id is required'),
  price: z.coerce.number().min(0, 'Proposal price must be a non-negative number.'),
  message: z.string().trim().max(1000, 'Message must be 1000 characters or less').optional(),
  deliveryDateTime: z.string().trim().optional(),
});

const deliveryFilterOptions = [
  { value: 'all', label: 'All delivery types' },
  { value: DeliveryType.PICKUP, label: 'Pickup' },
  { value: DeliveryType.DELIVERY, label: 'Delivery' },
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

const clientName = (request: RequestItem) => {
  if (typeof request.clientId === 'string') {
    return 'Client';
  }

  const firstName = request.clientId.firstName?.trim() ?? '';
  const lastName = request.clientId.lastName?.trim() ?? '';
  const combined = `${firstName} ${lastName}`.trim();
  return combined || 'Client';
};

export function ProfessionalRequestsPage() {
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [deliveryFilter, setDeliveryFilter] = useState<'all' | DeliveryType>('all');
  const [createdSort, setCreatedSort] = useState<CreatedSort>('newest');

  const [loadingRequestId, setLoadingRequestId] = useState<string | null>(null);
  const [proposalRequestId, setProposalRequestId] = useState<string | null>(null);
  const [proposalPrice, setProposalPrice] = useState('');
  const [proposalMessage, setProposalMessage] = useState('');
  const [proposalDateTime, setProposalDateTime] = useState('');
  const {
    setError: setFormError,
    clearErrors,
    formState: { errors },
  } = useForm<z.infer<typeof proposalFormSchema>>();

  const loadRequests = useCallback(async (query = '') => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await requestsService.getOpen({
        page: 1,
        limit: 50,
        search: query || undefined,
      });

      setRequests(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load open requests');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadRequests(appliedSearch);
  }, [loadRequests, appliedSearch]);

  const filteredRequests = useMemo(() => {
    const filtered =
      deliveryFilter === 'all'
        ? [...requests]
        : requests.filter((request) => request.deliveryType === deliveryFilter);

    filtered.sort((left, right) => {
      const leftTime = left.createdAt ? new Date(left.createdAt).getTime() : 0;
      const rightTime = right.createdAt ? new Date(right.createdAt).getTime() : 0;
      const safeLeft = Number.isNaN(leftTime) ? 0 : leftTime;
      const safeRight = Number.isNaN(rightTime) ? 0 : rightTime;

      return createdSort === 'newest' ? safeRight - safeLeft : safeLeft - safeRight;
    });

    return filtered;
  }, [createdSort, deliveryFilter, requests]);

  const onSubmitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const parsed = searchSchema.safeParse({ query: search });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Invalid search query.');
      return;
    }

    setAppliedSearch(parsed.data.query);
  };

  const openProposalForm = (requestId: string) => {
    setProposalRequestId(requestId);
    setProposalPrice('');
    setProposalMessage('');
    setProposalDateTime('');
    clearErrors();
    setError(null);
  };

  const closeProposalForm = () => {
    if (loadingRequestId) {
      return;
    }

    setProposalRequestId(null);
    setProposalPrice('');
    setProposalMessage('');
    setProposalDateTime('');
    clearErrors();
  };

  const handleSubmitProposal = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!proposalRequestId) {
      return;
    }

    const parsed = proposalFormSchema.safeParse({
      requestId: proposalRequestId,
      price: proposalPrice,
      message: proposalMessage,
      deliveryDateTime: proposalDateTime,
    });

    if (!parsed.success) {
      clearErrors();
      for (const issue of parsed.error.issues) {
        const field = issue.path[0];
        if (typeof field === 'string') {
          setFormError(field as keyof z.infer<typeof proposalFormSchema>, {
            type: 'manual',
            message: issue.message,
          });
        }
      }
      setError(null);
      return;
    }

    const values = parsed.data;

    setLoadingRequestId(proposalRequestId);
    clearErrors();
    setError(null);
    setSuccess(null);

    try {
      await proposalsService.create({
        requestId: values.requestId,
        price: values.price,
        message: values.message || undefined,
        deliveryDateTime: values.deliveryDateTime
          ? new Date(values.deliveryDateTime).toISOString()
          : undefined,
      });

      setSuccess('Proposal sent successfully.');
      closeProposalForm();
      await loadRequests(appliedSearch);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send proposal');
    } finally {
      setLoadingRequestId(null);
    }
  };

  return (
    <section className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold text-brand-ink">Open Requests</h1>
        <p className="text-sm text-brand-ink-soft">Review client requests and send proposals.</p>
      </header>

      <ProfessionalFiltersBar
        searchQuery={search}
        searchPlaceholder="Search request title or description"
        onSearchQueryChange={setSearch}
        onSearchSubmit={onSubmitSearch}
        primaryFilterLabel="Delivery"
        primaryFilterValue={deliveryFilter}
        primaryFilterOptions={deliveryFilterOptions}
        onPrimaryFilterChange={(value) => setDeliveryFilter(value as 'all' | DeliveryType)}
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
      ) : filteredRequests.length === 0 ? (
        <div className="rounded-xl border border-dashed border-brand-line bg-white py-10 text-center text-sm text-brand-ink-soft">
          No matching open requests found.
        </div>
      ) : (
        <div className="space-y-3">
          {filteredRequests.map((request) => {
            return (
              <article
                key={request.id}
                className="rounded-xl border border-brand-line bg-white p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-semibold text-brand-ink">{request.title}</h3>
                    <p className="text-xs text-brand-ink-soft">
                      By {clientName(request)} • Due {formatDate(request.deliveryDateTime)}
                    </p>
                  </div>
                  <span className="rounded-full bg-brand-cream-soft px-2.5 py-1 text-xs font-semibold text-brand-ink-soft">
                    Budget: {formatCurrency(request.budget)}
                  </span>
                </div>

                <p className="mt-2 text-sm text-brand-ink-soft">{request.description}</p>

                <div className="mt-3">
                  <button
                    type="button"
                    onClick={() => openProposalForm(request.id)}
                    className="inline-flex items-center gap-2 rounded-lg bg-brand-rose px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-brand-rose/90"
                  >
                    <Send className="h-3.5 w-3.5" />
                    Send Proposal
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {proposalRequestId ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-brand-ink/50 p-4">
          <div className="w-full max-w-2xl rounded-2xl border border-brand-line bg-white p-5 shadow-xl">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-brand-ink">Create Proposal</h2>
                <p className="text-xs text-brand-ink-soft">
                  Set your offer, optional delivery date, and message.
                </p>
              </div>
              <button
                type="button"
                onClick={closeProposalForm}
                disabled={Boolean(loadingRequestId)}
                className="rounded-lg border border-brand-line px-3 py-1.5 text-xs font-semibold text-brand-ink-soft transition hover:bg-brand-cream-soft disabled:cursor-not-allowed disabled:opacity-60"
              >
                Close
              </button>
            </div>

            <form className="space-y-3" onSubmit={handleSubmitProposal}>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="space-y-1">
                  <span className="text-xs font-semibold uppercase tracking-widest text-brand-ink-soft">
                    Price
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={proposalPrice}
                    onChange={(event) => {
                      setProposalPrice(event.target.value);
                      clearErrors('price');
                    }}
                    className="w-full rounded-lg border border-brand-line px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-brand-rose focus:outline-none"
                  />
                  <AppAlert message={errors.price?.message} />
                </label>

                <label className="space-y-1">
                  <span className="text-xs font-semibold uppercase tracking-widest text-brand-ink-soft">
                    Delivery date (optional)
                  </span>
                  <input
                    type="datetime-local"
                    value={proposalDateTime}
                    onChange={(event) => {
                      setProposalDateTime(event.target.value);
                      clearErrors('deliveryDateTime');
                    }}
                    className="w-full rounded-lg border border-brand-line px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-brand-rose focus:outline-none"
                  />
                  <AppAlert message={errors.deliveryDateTime?.message} />
                </label>

                <label className="space-y-1 sm:col-span-2">
                  <span className="text-xs font-semibold uppercase tracking-widest text-brand-ink-soft">
                    Message (optional)
                  </span>
                  <textarea
                    rows={3}
                    value={proposalMessage}
                    onChange={(event) => {
                      setProposalMessage(event.target.value);
                      clearErrors('message');
                    }}
                    className="w-full rounded-lg border border-brand-line px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-brand-rose focus:outline-none"
                  />
                  <AppAlert message={errors.message?.message} />
                </label>
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={closeProposalForm}
                  disabled={isLoading}
                  className="rounded-lg border border-brand-line px-3 py-1.5 text-xs font-semibold text-brand-ink-soft transition hover:bg-brand-cream-soft disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={Boolean(loadingRequestId)}
                  className="rounded-lg bg-brand-rose px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-brand-rose/90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loadingRequestId ? 'Sending...' : 'Submit Proposal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </section>
  );
}
