import { Loader2, Tag } from 'lucide-react';
import { type Category } from '@/src/services/categories.service';
import { CategoryListItem } from '@/src/components/admin/categories/CategoryListItem';

type CategoryListProps = {
  categories: Category[];
  isLoading: boolean;
  editingId: string | null;
  onEdit: (category: Category) => void;
  onDelete: (category: Category) => void;
};

export function CategoryList({
  categories,
  isLoading,
  editingId,
  onEdit,
  onDelete,
}: CategoryListProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-brand-line bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-brand-line bg-gray-50/50 px-5 py-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-brand-ink-soft">
          Existing Categories ({categories.length})
        </h3>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center py-20 text-brand-ink-soft">
          <Loader2 className="mb-2 h-8 w-8 animate-spin" />
          <p>Fetching data...</p>
        </div>
      ) : categories.length === 0 ? (
        <div className="flex flex-col items-center py-20 text-brand-ink-soft">
          <Tag className="mb-2 h-10 w-10 opacity-20" />
          <p>No categories found.</p>
        </div>
      ) : (
        <ul className="divide-y divide-brand-line">
          {categories.map((category) => (
            <CategoryListItem
              key={category.id}
              category={category}
              isEditing={editingId === category.id}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
