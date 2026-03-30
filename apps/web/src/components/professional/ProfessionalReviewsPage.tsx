'use client';

import { useCallback, useEffect, useState } from 'react';
import { Loader2, Star } from 'lucide-react';
import { AppAlert } from '@/src/components/common/AppAlert';
import { ReviewsList } from '@/src/components/reviews/ReviewsList';
import { reviewsService, type ReviewItem } from '@/src/services/reviews.service';

const PAGE_SIZE = 10;

export function ProfessionalReviewsPage() {
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [summary, setSummary] = useState({
    averageRating: 0,
    totalReviews: 0,
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: PAGE_SIZE,
    total: 0,
    pages: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadReviews = useCallback(async (page = 1) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await reviewsService.getMyReviews({ page, limit: PAGE_SIZE });
      setReviews(response.data);
      setSummary(response.summary);
      setPagination(response.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load reviews');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadReviews(1);
  }, [loadReviews]);

  return (
    <section className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold text-brand-ink">My Reviews</h1>
        <p className="text-sm text-brand-ink-soft">
          Track feedback from clients and improve your service.
        </p>
      </header>

      <AppAlert message={error} />

      <div className="grid gap-4 sm:grid-cols-2">
        <article className="rounded-xl border border-brand-line bg-brand-cream-soft p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-brand-ink-soft">
            Average rating
          </p>
          <div className="mt-2 inline-flex items-center gap-2 text-brand-ink">
            <Star className="h-5 w-5 fill-amber-500 text-amber-500" />
            <span className="text-xl font-bold">{summary.averageRating.toFixed(1)}</span>
          </div>
        </article>

        <article className="rounded-xl border border-brand-line bg-brand-cream-soft p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-brand-ink-soft">
            Total reviews
          </p>
          <p className="mt-2 text-xl font-bold text-brand-ink">{summary.totalReviews}</p>
        </article>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-brand-rose" />
        </div>
      ) : (
        <ReviewsList reviews={reviews} emptyMessage="No reviews yet from clients." />
      )}

      {pagination.pages > 1 && (
        <div className="flex items-center justify-between border-t border-brand-line pt-4">
          <button
            type="button"
            onClick={() => void loadReviews(pagination.page - 1)}
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
            onClick={() => void loadReviews(pagination.page + 1)}
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
