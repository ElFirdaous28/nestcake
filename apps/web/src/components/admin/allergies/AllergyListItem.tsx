import { Pencil, Trash2 } from 'lucide-react';
import { type Allergy } from '@/src/services/allergies.service';

type AllergyListItemProps = {
  allergy: Allergy;
  isEditing: boolean;
  onEdit: (allergy: Allergy) => void;
  onDelete: (allergy: Allergy) => void;
};

export function AllergyListItem({
  allergy,
  isEditing,
  onEdit,
  onDelete,
}: AllergyListItemProps) {
  return (
    <li
      className={`group flex items-center justify-between gap-4 px-5 py-4 transition-colors ${
        isEditing ? 'bg-brand-rose/5' : 'hover:bg-gray-50'
      }`}
    >
      <span className={`font-medium transition-colors ${isEditing ? 'text-brand-rose' : 'text-brand-ink'}`}>
        {allergy.name}
      </span>

      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onEdit(allergy)}
          className="rounded-lg border border-transparent p-2 text-brand-ink-soft transition-all hover:border-brand-line hover:bg-white hover:text-brand-rose hover:shadow-sm"
          title="Edit"
        >
          <Pencil className="h-4 w-4" />
        </button>

        <button
          type="button"
          onClick={() => onDelete(allergy)}
          className="rounded-lg border border-transparent p-2 text-brand-ink-soft transition-all hover:border-brand-line hover:bg-white hover:text-red-600 hover:shadow-sm"
          title="Delete"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </li>
  );
}
