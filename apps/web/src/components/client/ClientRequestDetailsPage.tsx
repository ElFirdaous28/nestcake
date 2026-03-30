'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ProposalStatus, RequestStatus } from '@shared-types';
import { Loader2 } from 'lucide-react';
import { AppAlert } from '@/src/components/common/AppAlert';
import { proposalsService, type ProposalItem } from '@/src/services/proposals.service';
import { requestsService, type RequestItem } from '@/src/services/requests.service';

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

const proposalStatusLabel: Record<ProposalStatus, string> = {
  [ProposalStatus.PENDING]: 'PENDING',
  [ProposalStatus.ACCEPTED]: 'ACCEPTED',
  [ProposalStatus.REJECTED]: 'REJECTED',
  [ProposalStatus.WITHDRAWN]: 'WITHDRAWN',
};

const requestStatusLabel: Record<RequestStatus, string> = {
  [RequestStatus.OPEN]: 'OPEN',
  [RequestStatus.MATCHED]: 'MATCHED',
  [RequestStatus.CLOSED]: 'CLOSED',
  [RequestStatus.CANCELLED]: 'CANCELLED',
};

const businessName = (proposal: ProposalItem) => {
  if (typeof proposal.professionalId === 'string') {
    return 'Professional';
  }

  return proposal.professionalId.businessName?.trim() || 'Professional';
};

type ClientRequestDetailsPageProps = {
  requestId: string;
};

export function ClientRequestDetailsPage({ requestId }: ClientRequestDetailsPageProps) {
  const [request, setRequest] = useState<RequestItem | null>(null);
  const [proposals, setProposals] = useState<ProposalItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [acceptingProposalId, setAcceptingProposalId] = useState<string | null>(null);
  const [isClosingRequest, setIsClosingRequest] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [requestData, proposalsData] = await Promise.all([
        requestsService.getById(requestId),
        proposalsService.getByRequest(requestId),
      ]);

      setRequest(requestData);
      setProposals(proposalsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load request details');
    } finally {
      setIsLoading(false);
    }
  }, [requestId]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const hasAcceptedProposal = useMemo(
    () => proposals.some((proposal) => proposal.status === ProposalStatus.ACCEPTED),
    [proposals],
  );

  const canAcceptProposals = request?.status === RequestStatus.OPEN && !hasAcceptedProposal;

  const handleAcceptProposal = async (proposalId: string) => {
    setAcceptingProposalId(proposalId);
    setError(null);
    setSuccess(null);

    try {
      await proposalsService.accept(proposalId);
      setSuccess('Proposal accepted. Continue in Orders to complete payment.');
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to accept proposal');
    } finally {
      setAcceptingProposalId(null);
    }
  };

  const handleCloseRequest = async () => {
    if (!request) {
      return;
    }

    setIsClosingRequest(true);
    setError(null);
    setSuccess(null);

    try {
      await requestsService.updateStatus(request.id, RequestStatus.CLOSED);
      setSuccess('Request marked as closed.');
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to close request');
    } finally {
      setIsClosingRequest(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-brand-rose" />
      </div>
    );
  }

  if (!request) {
    return (
      <section className="space-y-4">
        <AppAlert message={error ?? 'Request not found.'} />
        <Link
          href="/client/requests"
          className="text-sm font-semibold text-brand-ink-soft hover:text-brand-ink"
        >
          Back to requests
        </Link>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <header className="space-y-2">
        <Link
          href="/client/requests"
          className="text-sm font-semibold text-brand-ink-soft hover:text-brand-ink"
        >
          ← Back to requests
        </Link>

        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-brand-ink">{request.title}</h1>
            <p className="mt-1 text-sm text-brand-ink-soft">
              Due {formatDate(request.deliveryDateTime)} • Budget {formatCurrency(request.budget)}
            </p>
          </div>

          <span className="rounded-full bg-brand-cream-soft px-3 py-1 text-xs font-semibold text-brand-ink-soft">
            {requestStatusLabel[request.status]}
          </span>
        </div>

        <p className="text-sm leading-relaxed text-brand-ink-soft">{request.description}</p>
      </header>

      <AppAlert message={error} />
      <AppAlert message={success} variant="success" />

      <article className="rounded-xl border border-brand-line bg-brand-cream-soft p-4 text-sm text-brand-ink-soft">
        <p className="font-semibold text-brand-ink">Workflow checkpoint</p>
        <p className="mt-1">Accept one proposal, then complete payment from your Orders page.</p>
      </article>

      {request.status === RequestStatus.OPEN ? (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => void handleCloseRequest()}
            disabled={isClosingRequest || hasAcceptedProposal}
            className="rounded-lg border border-brand-line px-3 py-1.5 text-xs font-semibold text-brand-ink-soft transition hover:bg-brand-cream-soft disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isClosingRequest ? 'Closing...' : 'Close Request'}
          </button>
        </div>
      ) : null}

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-brand-ink">Proposals</h2>

        {proposals.length === 0 ? (
          <div className="rounded-xl border border-dashed border-brand-line bg-white py-10 text-center text-sm text-brand-ink-soft">
            No proposals yet. Professionals are still reviewing your request.
          </div>
        ) : (
          <div className="space-y-3">
            {proposals.map((proposal) => {
              const isAccepting = acceptingProposalId === proposal.id;
              const canAccept = canAcceptProposals && proposal.status === ProposalStatus.PENDING;

              return (
                <article
                  key={proposal.id}
                  className="rounded-xl border border-brand-line bg-white p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-sm font-semibold text-brand-ink">
                      {businessName(proposal)}
                    </h3>
                    <span className="rounded-full bg-brand-cream-soft px-2.5 py-1 text-xs font-semibold text-brand-ink-soft">
                      {proposalStatusLabel[proposal.status]}
                    </span>
                  </div>

                  <p className="mt-1 text-sm font-semibold text-brand-ink">
                    Offer: {formatCurrency(proposal.price)}
                  </p>
                  <p className="mt-1 text-xs text-brand-ink-soft">
                    Delivery: {formatDate(proposal.deliveryDateTime)}
                  </p>

                  <p className="mt-2 text-sm text-brand-ink-soft">
                    {proposal.message?.trim() || 'No additional message.'}
                  </p>

                  {canAccept ? (
                    <button
                      type="button"
                      onClick={() => void handleAcceptProposal(proposal.id)}
                      disabled={isAccepting}
                      className="mt-3 rounded-lg bg-brand-rose px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-brand-rose/90 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isAccepting ? 'Accepting...' : 'Accept Proposal'}
                    </button>
                  ) : null}
                </article>
              );
            })}
          </div>
        )}
      </section>
    </section>
  );
}
