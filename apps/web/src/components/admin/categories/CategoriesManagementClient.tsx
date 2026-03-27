'use client';

import { FormEvent, useEffect, useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { categoriesService, type Category } from '@/src/services/categories.service';
import { CategoryForm } from '@/src/components/admin/categories/CategoryForm';
import { CategoryList } from '@/src/components/admin/categories/CategoryList';
import { ConfirmDialog } from '@/src/components/common/ConfirmDialog';

type Mode = 'create' | 'edit';

export function CategoriesManagementClient() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [mode, setMode] = useState<Mode>('create');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);

  const loadCategories = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await categoriesService.getAll();
      setCategories(data);
    } catch {
      setError('Could not load categories. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadCategories();
  }, []);

  const resetForm = () => {
    setName('');
    setMode('create');
    setEditingId(null);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedName = name.trim();
    if (!trimmedName) {
      return;
    }

    try {
      setIsSaving(true);
      setError(null);

      if (mode === 'create') {
        const created = await categoriesService.create({ name: trimmedName });
        setCategories((prev) => [created, ...prev]);
      } else if (editingId) {
        const updated = await categoriesService.update(editingId, { name: trimmedName });
        setCategories((prev) => prev.map((item) => (item.id === editingId ? updated : item)));
      }

      resetForm();
    } catch {
      setError('Could not save category. Check if the name already exists.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (category: Category) => {
    setMode('edit');
    setEditingId(category.id);
    setName(category.name);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) {
      return;
    }

    try {
      setIsDeleting(true);
      setError(null);
      await categoriesService.remove(deleteTarget.id);
      setCategories((prev) => prev.filter((item) => item.id !== deleteTarget.id));

      if (editingId === deleteTarget.id) {
        resetForm();
      }

      setDeleteTarget(null);
    } catch {
      setError('Could not delete category.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDelete = (category: Category) => {
    setDeleteTarget(category);
  };

  return (
    <section className="mx-auto space-y-8 p-6">
      <header className="flex flex-col justify-between gap-4 border-b border-brand-line pb-6 md:flex-row md:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-brand-ink">Categories</h1>
          <p className="text-brand-ink-soft">Manage your product organization and taxonomy.</p>
        </div>

        {error && (
          <div className="animate-in fade-in slide-in-from-top-1 flex items-center gap-2 rounded-lg border border-red-100 bg-red-50 px-4 py-2 text-sm text-red-600">
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
        )}
      </header>

      <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
        <div className="sticky top-6 lg:col-span-4">
          <CategoryForm
            mode={mode}
            name={name}
            isSaving={isSaving}
            onNameChange={setName}
            onSubmit={handleSubmit}
            onCancelEdit={resetForm}
          />
        </div>

        <div className="lg:col-span-8">
          <CategoryList
            categories={categories}
            isLoading={isLoading}
            editingId={editingId}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        </div>
      </div>

      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        title="Delete Category"
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
