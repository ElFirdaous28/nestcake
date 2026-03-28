'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import { ProfessionalVerificationStatus } from '@shared-types';
import { Loader2, MapPin, Pencil, Star } from 'lucide-react';
import { AppAlert } from '@/src/components/common/AppAlert';
import { ReviewsList } from '@/src/components/reviews/ReviewsList';
import {
  professionalsService,
  type ProfessionalItem,
} from '@/src/services/professionals.service';
import { reviewsService, type ReviewItem } from '@/src/services/reviews.service';

const statusLabelMap: Record<ProfessionalVerificationStatus, string> = {
  [ProfessionalVerificationStatus.PENDING]: 'Pending verification',
  [ProfessionalVerificationStatus.VERIFIED]: 'Verified professional',
  [ProfessionalVerificationStatus.REJECTED]: 'Verification rejected',
};

const statusClassMap: Record<ProfessionalVerificationStatus, string> = {
  [ProfessionalVerificationStatus.PENDING]: 'border-amber-200 bg-amber-50 text-amber-700',
  [ProfessionalVerificationStatus.VERIFIED]: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  [ProfessionalVerificationStatus.REJECTED]: 'border-red-200 bg-red-50 text-red-700',
};

const toCoordinateText = (value: number | undefined) => {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return '';
  }

  return String(value);
};

export function ProfessionalProfilePanel() {
  const [professional, setProfessional] = useState<ProfessionalItem | null>(null);
  const [recentReviews, setRecentReviews] = useState<ReviewItem[]>([]);
  const [averageRating, setAverageRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);
  const [businessName, setBusinessName] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [longitude, setLongitude] = useState('');
  const [latitude, setLatitude] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const syncForm = (item: ProfessionalItem) => {
    setBusinessName(item.businessName ?? '');
    setDescription(item.description ?? '');
    setAddress(item.address ?? '');
    setLongitude(toCoordinateText(item.location?.coordinates?.[0]));
    setLatitude(toCoordinateText(item.location?.coordinates?.[1]));
  };

  const loadProfile = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const profile = await professionalsService.getMe();
      setProfessional(profile);
      syncForm(profile);

      const reviewsResponse = await reviewsService.getByProfessional(profile.id, {
        page: 1,
        limit: 5,
      });

      setRecentReviews(reviewsResponse.data);
      setAverageRating(reviewsResponse.summary.averageRating ?? 0);
      setTotalReviews(reviewsResponse.summary.totalReviews ?? 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load professional profile');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!professional) {
      return;
    }

    const parsedLongitude = Number(longitude);
    const parsedLatitude = Number(latitude);

    if (!businessName.trim()) {
      setError('Business name is required.');
      return;
    }

    if (!address.trim()) {
      setError('Address is required.');
      return;
    }

    if (!Number.isFinite(parsedLongitude) || !Number.isFinite(parsedLatitude)) {
      setError('Latitude and longitude must be valid numbers.');
      return;
    }

    setIsSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const updated = await professionalsService.updateMe({
        businessName: businessName.trim(),
        description: description.trim() || undefined,
        address: address.trim(),
        location: {
          type: 'Point',
          coordinates: [parsedLongitude, parsedLatitude],
        },
      });

      setProfessional(updated);
      syncForm(updated);
      setSuccess('Profile updated successfully.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-brand-rose" />
      </div>
    );
  }

  if (!professional) {
    return <AppAlert message={error ?? 'Professional profile not found.'} />;
  }

  return (
    <section className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-brand-ink">Professional Profile</h1>
          <p className="mt-1 text-sm text-brand-ink-soft">
            Update your business details, location, and public profile data.
          </p>
        </div>

        <span
          className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${statusClassMap[professional.verificationStatus]}`}
        >
          {statusLabelMap[professional.verificationStatus]}
        </span>
      </header>

      <AppAlert message={error} />
      <AppAlert message={success} variant="success" />

      <div className="grid gap-4 md:grid-cols-3">
        <article className="rounded-xl border border-brand-line bg-brand-cream-soft p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-brand-ink-soft">Rating</p>
          <div className="mt-2 inline-flex items-center gap-2 text-brand-ink">
            <Star className="h-5 w-5 fill-amber-500 text-amber-500" />
            <span className="text-xl font-bold">{averageRating.toFixed(1)}</span>
          </div>
          <p className="mt-1 text-sm text-brand-ink-soft">Based on {totalReviews} reviews</p>
        </article>

        <article className="rounded-xl border border-brand-line bg-brand-cream-soft p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-brand-ink-soft">Portfolio items</p>
          <p className="mt-2 text-xl font-bold text-brand-ink">{professional.portfolio.length}</p>
          <p className="mt-1 text-sm text-brand-ink-soft">Showcase pieces in your public profile</p>
        </article>

        <article className="rounded-xl border border-brand-line bg-brand-cream-soft p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-brand-ink-soft">Business</p>
          <p className="mt-2 text-xl font-bold text-brand-ink">{professional.businessName}</p>
          <p className="mt-1 inline-flex items-center gap-1.5 text-sm text-brand-ink-soft">
            <MapPin className="h-4 w-4" />
            {professional.address}
          </p>
        </article>
      </div>

      <form onSubmit={handleSubmit} className="rounded-2xl border border-brand-line bg-white p-5 shadow-sm">
        <div className="flex items-center gap-2">
          <Pencil className="h-4 w-4 text-brand-ink-soft" />
          <h2 className="text-base font-semibold text-brand-ink">Edit profile details</h2>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="space-y-1 sm:col-span-2">
            <span className="text-sm font-medium text-brand-ink">Business name</span>
            <input
              value={businessName}
              onChange={(event) => setBusinessName(event.target.value)}
              className="w-full rounded-lg border border-brand-line px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-brand-rose focus:outline-none"
              required
            />
          </label>

          <label className="space-y-1 sm:col-span-2">
            <span className="text-sm font-medium text-brand-ink">Description</span>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={4}
              className="w-full rounded-lg border border-brand-line px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-brand-rose focus:outline-none"
            />
          </label>

          <label className="space-y-1 sm:col-span-2">
            <span className="text-sm font-medium text-brand-ink">Address</span>
            <input
              value={address}
              onChange={(event) => setAddress(event.target.value)}
              className="w-full rounded-lg border border-brand-line px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-brand-rose focus:outline-none"
              required
            />
          </label>

          <label className="space-y-1">
            <span className="text-sm font-medium text-brand-ink">Longitude</span>
            <input
              value={longitude}
              onChange={(event) => setLongitude(event.target.value)}
              inputMode="decimal"
              className="w-full rounded-lg border border-brand-line px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-brand-rose focus:outline-none"
              required
            />
          </label>

          <label className="space-y-1">
            <span className="text-sm font-medium text-brand-ink">Latitude</span>
            <input
              value={latitude}
              onChange={(event) => setLatitude(event.target.value)}
              inputMode="decimal"
              className="w-full rounded-lg border border-brand-line px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-brand-rose focus:outline-none"
              required
            />
          </label>
        </div>

        <div className="mt-5 flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="rounded-lg bg-brand-rose px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-rose/90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSaving ? 'Saving...' : 'Save profile'}
          </button>
        </div>
      </form>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-brand-ink">Latest reviews</h2>
        <ReviewsList reviews={recentReviews} emptyMessage="No reviews yet for your profile." />
      </section>
    </section>
  );
}
