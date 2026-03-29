'use client';

import { FormEvent, useEffect, useState } from 'react';
import { z } from 'zod';
import { allergiesService, type Allergy } from '@/src/services/allergies.service';
import { AllergyForm } from '@/src/components/admin/allergies/AllergyForm';
import { AllergyList } from '@/src/components/admin/allergies/AllergyList';
import { ConfirmDialog } from '@/src/components/common/ConfirmDialog';
import { AppAlert } from '@/src/components/common/AppAlert';

type Mode = 'create' | 'edit';

const allergyFormSchema = z.object({
  name: z.string().trim().min(1, 'Allergy name is required.').max(80, 'Allergy name must be 80 characters or less.'),
});

export function AllergiesManagementClient() {
  const [allergies, setAllergies] = useState<Allergy[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ name?: string }>({});
  const [name, setName] = useState('');
  const [mode, setMode] = useState<Mode>('create');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Allergy | null>(null);

  const loadAllergies = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await allergiesService.getAll();
      setAllergies(data);
    } catch {
      setError('Could not load allergies. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadAllergies();
  }, []);

  const resetForm = () => {
    setName('');
    setFieldErrors({});
    setMode('create');
    setEditingId(null);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const parsed = allergyFormSchema.safeParse({ name });

    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      setFieldErrors({ name: issue?.message ?? 'Please check allergy name.' });
      return;
    }

    const values = parsed.data;

    try {
      setIsSaving(true);
      setError(null);
      setFieldErrors({});

      if (mode === 'create') {
        const created = await allergiesService.create({ name: values.name });
        setAllergies((prev) => [created, ...prev]);
      } else if (editingId) {
        const updated = await allergiesService.update(editingId, { name: values.name });
        setAllergies((prev) => prev.map((item) => (item.id === editingId ? updated : item)));
      }

      resetForm();
    } catch {
      setError('Could not save allergy. Check if the name already exists.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (allergy: Allergy) => {
    setMode('edit');
    setEditingId(allergy.id);
    setName(allergy.name);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) {
      return;
    }

    try {
      setIsDeleting(true);
      setError(null);
      await allergiesService.remove(deleteTarget.id);
      setAllergies((prev) => prev.filter((item) => item.id !== deleteTarget.id));

      if (editingId === deleteTarget.id) {
        resetForm();
      }

      setDeleteTarget(null);
    } catch {
      setError('Could not delete allergy.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDelete = (allergy: Allergy) => {
    setDeleteTarget(allergy);
  };

  return (
    <section className="mx-auto space-y-8 p-6">
      <header className="flex flex-col justify-between gap-4 border-b border-brand-line pb-6 md:flex-row md:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-brand-ink">Allergies</h1>
          <p className="text-brand-ink-soft">Manage allergy labels available for products and requests.</p>
        </div>
      </header>

      <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
        <div className="sticky top-6 flex flex-col gap-6 lg:col-span-4">
          <AllergyForm
            mode={mode}
            name={name}
            nameError={fieldErrors.name}
            isSaving={isSaving}
            onNameChange={(value) => {
              setName(value);
              setFieldErrors((prev) => ({ ...prev, name: undefined }));
            }}
            onSubmit={handleSubmit}
            onCancelEdit={resetForm}
          />

          <AppAlert message={error} />
        </div>

        <div className="lg:col-span-8">
          <AllergyList
            allergies={allergies}
            isLoading={isLoading}
            editingId={editingId}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        </div>
      </div>

      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        title="Delete Allergy"
        description={`Are you sure you want to delete "${deleteTarget?.name ?? ''}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        isConfirming={isDeleting}
        onConfirm={() => void confirmDelete()}
        onCancel={() => {
          if (!isDeleting) {
            setDeleteTarget(null);
          }
        }}
      />
    </section>
  );
}
