'use client';

/* eslint-disable @next/next/no-img-element */

import { Star } from 'lucide-react';
import { type ReviewItem } from '@/src/services/reviews.service';

type ReviewsListProps = {
  reviews: ReviewItem[];
  emptyMessage?: string;
};

const formatDate = (value?: string) => {
  if (!value) {
    return 'Recently';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'Recently';
  }

  return new Intl.DateTimeFormat('en-US', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
};

const getReviewerName = (review: ReviewItem) => {
  if (typeof review.clientId === 'string') {
    return 'Client';
  }

  const firstName = review.clientId.firstName?.trim() ?? '';
  const lastName = review.clientId.lastName?.trim() ?? '';
  const combined = `${firstName} ${lastName}`.trim();

  return combined || 'Client';
};

const getReviewerAvatar = (review: ReviewItem) => {
  if (typeof review.clientId === 'string') {
    return undefined;
  }

  return review.clientId.avatar;
};

export function ReviewsList({ reviews, emptyMessage = 'No reviews yet.' }: ReviewsListProps) {
  if (reviews.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-brand-line bg-brand-cream-soft py-8 text-center text-sm text-brand-ink-soft">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {reviews.map((review) => {
        const reviewerName = getReviewerName(review);
        const reviewerAvatar = getReviewerAvatar(review);

        return (
          <article key={review.id} className="rounded-xl border border-brand-line bg-white p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                {reviewerAvatar ? (
                  <img
                    src={reviewerAvatar}
                    alt={reviewerName}
                    className="h-10 w-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-rose text-xs font-bold text-white">
                    {reviewerName.slice(0, 2).toUpperCase()}
                  </div>
                )}

                <div className="min-w-0">
                  <h3 className="truncate text-sm font-semibold text-brand-ink">{reviewerName}</h3>
                  <p className="text-xs text-brand-ink-soft">{formatDate(review.createdAt)}</p>
                </div>
              </div>

              <div className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
                <Star className="h-3.5 w-3.5 fill-current" />
                {review.rating.toFixed(1)}
              </div>
            </div>

            {review.comment ? (
              <p className="mt-3 text-sm leading-relaxed text-brand-ink-soft">{review.comment}</p>
            ) : (
              <p className="mt-3 text-sm italic text-brand-ink-soft">No written feedback provided.</p>
            )}
          </article>
        );
      })}
    </div>
  );
}
