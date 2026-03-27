import { Loader2, TriangleAlert } from 'lucide-react';
import { type Allergy } from '@/src/services/allergies.service';
import { AllergyListItem } from '@/src/components/admin/allergies/AllergyListItem';

type AllergyListProps = {
  allergies: Allergy[];
  isLoading: boolean;
  editingId: string | null;
  onEdit: (allergy: Allergy) => void;
  onDelete: (allergy: Allergy) => void;
};

export function AllergyList({
  allergies,
  isLoading,
  editingId,
  onEdit,
  onDelete,
}: AllergyListProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-brand-line bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-brand-line bg-gray-50/50 px-5 py-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-brand-ink-soft">
          Existing Allergies ({allergies.length})
        </h3>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center py-20 text-brand-ink-soft">
          <Loader2 className="mb-2 h-8 w-8 animate-spin" />
          <p>Fetching data...</p>
        </div>
      ) : allergies.length === 0 ? (
        <div className="flex flex-col items-center py-20 text-brand-ink-soft">
          <TriangleAlert className="mb-2 h-10 w-10 opacity-20" />
          <p>No allergies found.</p>
        </div>
      ) : (
        <ul className="divide-y divide-brand-line">
          {allergies.map((allergy) => (
            <AllergyListItem
              key={allergy.id}
              allergy={allergy}
              isEditing={editingId === allergy.id}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
