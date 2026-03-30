'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { ImagePlus, Loader2, Trash2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { AppAlert } from '@/src/components/common/AppAlert';
import { ConfirmDialog } from '@/src/components/common/ConfirmDialog';
import {
  professionalsService,
  type ProfessionalItem,
} from '@/src/services/professionals.service';

type PortfolioDeleteTarget = {
  id: string;
  title: string;
};

const FALLBACK_IMAGE =
  'data:image/svg+xml;utf8,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22600%22 height=%22400%22%3E%3Crect width=%22100%25%22 height=%22100%25%22 fill=%22%23f3ede4%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 dominant-baseline=%22middle%22 text-anchor=%22middle%22 font-family=%22Arial,sans-serif%22 font-size=%2222%22 fill=%22%236b5344%22%3ENo image%3C/text%3E%3C/svg%3E';

const portfolioFormSchema = z.object({
  title: z.string().trim().max(120, 'Title must be 120 characters or less').optional(),
  description: z.string().trim().max(500, 'Description must be 500 characters or less').optional(),
  imageFile: z.instanceof(File, { message: 'Please select an image for the portfolio item.' }),
});

export function ProfessionalPortfolioManager() {
  const [professional, setProfessional] = useState<ProfessionalItem | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const {
    setError: setFormError,
    clearErrors,
    formState: { errors },
  } = useForm<z.infer<typeof portfolioFormSchema>>();
  const [deleteTarget, setDeleteTarget] = useState<PortfolioDeleteTarget | null>(null);

  const loadProfile = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const me = await professionalsService.getMe();
      setProfessional(me);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load portfolio');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  const portfolioItems = useMemo(() => professional?.portfolio ?? [], [professional?.portfolio]);

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setImageFile(null);
    clearErrors();
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const parsed = portfolioFormSchema.safeParse({
      title,
      description,
      imageFile,
    });

    if (!parsed.success) {
      clearErrors();
      for (const issue of parsed.error.issues) {
        const field = issue.path[0];
        if (typeof field === 'string') {
          setFormError(field as keyof z.infer<typeof portfolioFormSchema>, {
            type: 'manual',
            message: issue.message,
          });
        }
      }
      setError(null);
      return;
    }

    const values = parsed.data;

    setIsSubmitting(true);
    clearErrors();
    setError(null);
    setSuccess(null);

    try {
      const updated = await professionalsService.addPortfolioItem({
        imageFile: values.imageFile,
        title: values.title || undefined,
        description: values.description || undefined,
      });

      setProfessional(updated);
      resetForm();
      setSuccess('Portfolio item added successfully.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add portfolio item');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) {
      return;
    }

    setIsDeleting(true);
    setError(null);
    setSuccess(null);

    try {
      const updated = await professionalsService.removePortfolioItem(deleteTarget.id);
      setProfessional(updated);
      setDeleteTarget(null);
      setSuccess('Portfolio item removed successfully.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove portfolio item');
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-brand-rose" />
      </div>
    );
  }

  return (
    <section className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold text-brand-ink">Portfolio</h1>
        <p className="text-sm text-brand-ink-soft">
          Showcase your best cake designs and finished work for clients.
        </p>
      </header>

      <AppAlert message={error} />
      <AppAlert message={success} variant="success" />

      <form onSubmit={handleSubmit} className="rounded-2xl border border-brand-line bg-white p-5 shadow-sm">
        <div className="flex items-center gap-2">
          <ImagePlus className="h-5 w-5 text-brand-ink-soft" />
          <h2 className="text-base font-semibold text-brand-ink">Add portfolio item</h2>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="space-y-1 sm:col-span-2">
            <span className="text-sm font-medium text-brand-ink">Image</span>
            <input
              type="file"
              accept="image/*"
              onChange={(event) => {
                setImageFile(event.target.files?.[0] ?? null);
                clearErrors('imageFile');
              }}
              className="w-full rounded-lg border border-brand-line px-3 py-2 text-sm"
            />
            <AppAlert message={errors.imageFile?.message} />
          </label>

          <label className="space-y-1 sm:col-span-2">
            <span className="text-sm font-medium text-brand-ink">Title (optional)</span>
            <input
              value={title}
              onChange={(event) => {
                setTitle(event.target.value);
                clearErrors('title');
              }}
              maxLength={120}
              className="w-full rounded-lg border border-brand-line px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-brand-rose focus:outline-none"
            />
            <AppAlert message={errors.title?.message} />
          </label>

          <label className="space-y-1 sm:col-span-2">
            <span className="text-sm font-medium text-brand-ink">Description (optional)</span>
            <textarea
              value={description}
              onChange={(event) => {
                setDescription(event.target.value);
                clearErrors('description');
              }}
              rows={3}
              maxLength={500}
              className="w-full rounded-lg border border-brand-line px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-brand-rose focus:outline-none"
            />
            <AppAlert message={errors.description?.message} />
          </label>
        </div>

        <div className="mt-5 flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-lg bg-brand-rose px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-rose/90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? 'Uploading...' : 'Add to portfolio'}
          </button>
        </div>
      </form>

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-lg font-semibold text-brand-ink">Your items</h2>
          <span className="text-sm text-brand-ink-soft">{portfolioItems.length} total</span>
        </div>

        {portfolioItems.length === 0 ? (
          <div className="rounded-xl border border-dashed border-brand-line bg-brand-cream-soft py-10 text-center text-sm text-brand-ink-soft">
            You have no portfolio items yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {portfolioItems.map((item, index) => {
              const itemTitle = item.title?.trim() || `Portfolio item ${index + 1}`;
              const itemId = item._id;
              const image = item.images?.[0] || FALLBACK_IMAGE;

              return (
                <article key={`${itemTitle}-${index}`} className="overflow-hidden rounded-xl border border-brand-line bg-white">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={image}
                    alt={itemTitle}
                    className="h-44 w-full object-cover"
                  />

                  <div className="space-y-2 p-4">
                    <h3 className="line-clamp-1 text-sm font-semibold text-brand-ink">{itemTitle}</h3>
                    <p className="line-clamp-3 text-sm text-brand-ink-soft">
                      {item.description?.trim() || 'No description provided.'}
                    </p>

                    <button
                      type="button"
                      disabled={!itemId}
                      onClick={() => {
                        if (!itemId) {
                          return;
                        }

                        setDeleteTarget({ id: itemId, title: itemTitle });
                      }}
                      className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Remove
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        title="Remove Portfolio Item"
        description={`Are you sure you want to remove ${deleteTarget?.title ?? 'this item'}?`}
        confirmText="Remove"
        cancelText="Cancel"
        isConfirming={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          if (!isDeleting) {
            setDeleteTarget(null);
          }
        }}
      />
    </section>
  );
}
