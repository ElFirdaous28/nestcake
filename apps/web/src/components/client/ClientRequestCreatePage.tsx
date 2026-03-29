'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useState } from 'react';
import { DeliveryType } from '@shared-types';
import { Plus } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { AppAlert } from '@/src/components/common/AppAlert';
import { allergiesService, type Allergy } from '@/src/services/allergies.service';
import { requestsService } from '@/src/services/requests.service';

const requestCreateSchema = z
  .object({
    title: z.string().trim().min(1, 'Title is required'),
    description: z.string().trim().min(1, 'Description is required'),
    eventType: z.string().trim().optional(),
    budget: z.string().trim().optional(),
    deliveryDateTime: z.string().trim().min(1, 'Delivery date and time is required'),
    deliveryType: z.nativeEnum(DeliveryType),
    location: z.string().trim().optional(),
    allergyIds: z.array(z.string().trim()).optional(),
  })
  .superRefine((values, ctx) => {
    if (values.deliveryType === DeliveryType.DELIVERY && !values.location) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Location is required for delivery requests.',
        path: ['location'],
      });
    }

    if (values.budget) {
      const parsedBudget = Number(values.budget);
      if (!Number.isFinite(parsedBudget) || parsedBudget < 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Budget must be a non-negative number.',
          path: ['budget'],
        });
      }
    }
  });

export function ClientRequestCreatePage() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [eventType, setEventType] = useState('');
  const [budget, setBudget] = useState('');
  const [deliveryDateTime, setDeliveryDateTime] = useState('');
  const [deliveryType, setDeliveryType] = useState<DeliveryType>(DeliveryType.PICKUP);
  const [location, setLocation] = useState('');
  const [allergies, setAllergies] = useState<Allergy[]>([]);
  const [selectedAllergyIds, setSelectedAllergyIds] = useState<string[]>([]);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const {
    setError: setFormError,
    clearErrors,
    formState: { errors },
  } = useForm<z.infer<typeof requestCreateSchema>>();

  useEffect(() => {
    const loadAllergies = async () => {
      try {
        const data = await allergiesService.getAll();
        setAllergies(data);
      } catch {
        setAllergies([]);
      }
    };

    void loadAllergies();
  }, []);

  const toggleAllergy = (id: string) => {
    setSelectedAllergyIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
    clearErrors('allergyIds');
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setEventType('');
    setBudget('');
    setDeliveryDateTime('');
    setDeliveryType(DeliveryType.PICKUP);
    setLocation('');
    setSelectedAllergyIds([]);
    setImageFile(null);
    clearErrors();
  };

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const parsed = requestCreateSchema.safeParse({
      title,
      description,
      eventType,
      budget,
      deliveryDateTime,
      deliveryType,
      location,
      allergyIds: selectedAllergyIds,
    });

    if (!parsed.success) {
      clearErrors();
      for (const issue of parsed.error.issues) {
        const field = issue.path[0];
        if (typeof field === 'string') {
          setFormError(field as keyof z.infer<typeof requestCreateSchema>, {
            type: 'manual',
            message: issue.message,
          });
        }
      }
      setError(null);
      return;
    }

    const values = parsed.data;
    const normalizedBudget =
      values.budget && values.budget.length > 0
        ? Number(values.budget)
        : undefined;

    setIsSubmitting(true);
    clearErrors();
    setError(null);
    setSuccess(null);

    try {
      await requestsService.create({
        title: values.title,
        description: values.description,
        eventType: values.eventType || undefined,
        budget: Number.isFinite(normalizedBudget as number)
          ? normalizedBudget
          : undefined,
        deliveryDateTime: new Date(values.deliveryDateTime).toISOString(),
        deliveryType: values.deliveryType,
        location: values.deliveryType === DeliveryType.DELIVERY ? values.location : undefined,
        allergyIds: values.allergyIds && values.allergyIds.length > 0 ? values.allergyIds : undefined,
        imageFile: imageFile ?? undefined,
      });

      setSuccess('Request submitted. Professionals can now send proposals.');
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create request');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="space-y-6">
      <header className="space-y-2">
        <Link href="/client/requests" className="text-sm font-semibold text-brand-ink-soft hover:text-brand-ink">
          ← Back to requests
        </Link>

        <h1 className="text-2xl font-bold text-brand-ink">Create Request</h1>
        <p className="text-sm text-brand-ink-soft">
          Step 1: submit your request and wait for professionals to send proposals.
        </p>
      </header>

      <AppAlert message={error} />
      <AppAlert message={success} variant="success" />

      <form onSubmit={handleCreate} className="rounded-2xl border border-brand-line bg-white p-5 shadow-sm">
        <div className="flex items-center gap-2">
          <Plus className="h-4 w-4 text-brand-ink-soft" />
          <h2 className="text-base font-semibold text-brand-ink">Request details</h2>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="space-y-1 sm:col-span-2">
            <span className="text-sm font-medium text-brand-ink">Title</span>
            <input
              value={title}
              onChange={(event) => {
                setTitle(event.target.value);
                clearErrors('title');
              }}
              className="w-full rounded-lg border border-brand-line px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-brand-rose focus:outline-none"
            />
            <AppAlert message={errors.title?.message} />
          </label>

          <label className="space-y-1 sm:col-span-2">
            <span className="text-sm font-medium text-brand-ink">Description</span>
            <textarea
              value={description}
              onChange={(event) => {
                setDescription(event.target.value);
                clearErrors('description');
              }}
              rows={4}
              className="w-full rounded-lg border border-brand-line px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-brand-rose focus:outline-none"
            />
            <AppAlert message={errors.description?.message} />
          </label>

          <label className="space-y-1">
            <span className="text-sm font-medium text-brand-ink">Event type (optional)</span>
            <input
              value={eventType}
              onChange={(event) => {
                setEventType(event.target.value);
                clearErrors('eventType');
              }}
              className="w-full rounded-lg border border-brand-line px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-brand-rose focus:outline-none"
            />
            <AppAlert message={errors.eventType?.message} />
          </label>

          <label className="space-y-1">
            <span className="text-sm font-medium text-brand-ink">Budget (optional)</span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={budget}
              onChange={(event) => {
                setBudget(event.target.value);
                clearErrors('budget');
              }}
              className="w-full rounded-lg border border-brand-line px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-brand-rose focus:outline-none"
            />
            <AppAlert message={errors.budget?.message} />
          </label>

          <label className="space-y-1">
            <span className="text-sm font-medium text-brand-ink">Delivery date and time</span>
            <input
              type="datetime-local"
              value={deliveryDateTime}
              onChange={(event) => {
                setDeliveryDateTime(event.target.value);
                clearErrors('deliveryDateTime');
              }}
              className="w-full rounded-lg border border-brand-line px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-brand-rose focus:outline-none"
            />
            <AppAlert message={errors.deliveryDateTime?.message} />
          </label>

          <label className="space-y-1">
            <span className="text-sm font-medium text-brand-ink">Delivery type</span>
            <select
              value={deliveryType}
              onChange={(event) => {
                setDeliveryType(event.target.value as DeliveryType);
                clearErrors(['deliveryType', 'location']);
              }}
              className="w-full rounded-lg border border-brand-line px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-brand-rose focus:outline-none"
            >
              <option value={DeliveryType.PICKUP}>Pickup</option>
              <option value={DeliveryType.DELIVERY}>Delivery</option>
            </select>
            <AppAlert message={errors.deliveryType?.message} />
          </label>

          {deliveryType === DeliveryType.DELIVERY ? (
            <label className="space-y-1 sm:col-span-2">
              <span className="text-sm font-medium text-brand-ink">Delivery address</span>
              <input
                value={location}
                onChange={(event) => {
                  setLocation(event.target.value);
                  clearErrors('location');
                }}
                className="w-full rounded-lg border border-brand-line px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-brand-rose focus:outline-none"
              />
              <AppAlert message={errors.location?.message} />
            </label>
          ) : null}

          <label className="space-y-1 sm:col-span-2">
            <span className="text-sm font-medium text-brand-ink">Reference image (optional)</span>
            <input
              type="file"
              accept="image/*"
              onChange={(event) => setImageFile(event.target.files?.[0] ?? null)}
              className="w-full rounded-lg border border-brand-line px-3 py-2 text-sm"
            />
          </label>

          <div className="space-y-2 sm:col-span-2">
            <p className="text-sm font-medium text-brand-ink">Allergies (optional)</p>
            {allergies.length === 0 ? (
              <p className="text-sm text-brand-ink-soft">No allergy labels available.</p>
            ) : (
              <div className="grid gap-2 sm:grid-cols-2">
                {allergies.map((allergy) => (
                  <label
                    key={allergy.id}
                    className="flex items-center gap-2 rounded-lg border border-brand-line px-3 py-2"
                  >
                    <input
                      type="checkbox"
                      checked={selectedAllergyIds.includes(allergy.id)}
                      onChange={() => toggleAllergy(allergy.id)}
                      className="h-4 w-4 rounded border-brand-line"
                    />
                    <span className="text-sm text-brand-ink">{allergy.name}</span>
                  </label>
                ))}
              </div>
            )}
            <AppAlert message={errors.allergyIds?.message} />
          </div>
        </div>

        <div className="mt-5 flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-lg bg-brand-rose px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-rose/90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? 'Submitting...' : 'Submit request'}
          </button>
        </div>
      </form>
    </section>
  );
}
