import { Pencil, Trash2 } from 'lucide-react';
import { type Category } from '@/src/services/categories.service';

type CategoryListItemProps = {
  category: Category;
  isEditing: boolean;
  onEdit: (category: Category) => void;
  onDelete: (category: Category) => void;
};

export function CategoryListItem({
  category,
  isEditing,
  onEdit,
  onDelete,
}: CategoryListItemProps) {
  return (
    <li
      className={`group flex items-center justify-between gap-4 px-5 py-4 transition-colors ${
        isEditing ? 'bg-brand-rose/5' : 'hover:bg-gray-50'
      }`}
    >
      <span className={`font-medium transition-colors ${isEditing ? 'text-brand-rose' : 'text-brand-ink'}`}>
        {category.name}
      </span>

      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onEdit(category)}
          className="rounded-lg border border-transparent p-2 text-brand-ink-soft transition-all hover:border-brand-line hover:bg-white hover:text-brand-rose hover:shadow-sm"
          title="Edit"
        >
          <Pencil className="h-4 w-4" />
        </button>

        <button
          type="button"
          onClick={() => onDelete(category)}
          className="rounded-lg border border-transparent p-2 text-brand-ink-soft transition-all hover:border-brand-line hover:bg-white hover:text-red-600 hover:shadow-sm"
          title="Delete"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </li>
  );
}
