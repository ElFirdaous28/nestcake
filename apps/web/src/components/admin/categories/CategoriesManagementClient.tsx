'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { categoriesService, type Category } from '@/src/services/categories.service';
import { CategoryForm } from '@/src/components/admin/categories/CategoryForm';
import { CategoryList } from '@/src/components/admin/categories/CategoryList';
import { ConfirmDialog } from '@/src/components/common/ConfirmDialog';
import { AppAlert } from '@/src/components/common/AppAlert';

type Mode = 'create' | 'edit';

const categoryFormSchema = z.object({
    name: z.string().trim().min(1, 'Category name is required.').max(80, 'Category name must be 80 characters or less.'),
});

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
    const {
        setError: setFormError,
        clearErrors,
        formState: { errors },
    } = useForm<z.infer<typeof categoryFormSchema>>();

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
        clearErrors();
        setMode('create');
        setEditingId(null);
    };

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const parsed = categoryFormSchema.safeParse({ name });

        if (!parsed.success) {
            clearErrors();
            setFormError('name', {
                type: 'manual',
                message: parsed.error.flatten().fieldErrors.name?.[0] ?? 'Please check category name.',
            });
            setError(null);
            return;
        }

        const values = parsed.data;

        try {
            setIsSaving(true);
            clearErrors();
            setError(null);

            if (mode === 'create') {
                const created = await categoriesService.create({ name: values.name });
                setCategories((prev) => [created, ...prev]);
            } else if (editingId) {
                const updated = await categoriesService.update(editingId, { name: values.name });
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
        clearErrors();
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

            </header>

            <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
                <div className="sticky top-6 lg:col-span-4 flex flex-col gap-6">
                    <CategoryForm
                        mode={mode}
                        name={name}
                        nameError={errors.name?.message}
                        isSaving={isSaving}
                        onNameChange={(value) => {
                            setName(value);
                            clearErrors('name');
                        }}
                        onSubmit={handleSubmit}
                        onCancelEdit={resetForm}
                    />

                    <AppAlert message={error} />

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
