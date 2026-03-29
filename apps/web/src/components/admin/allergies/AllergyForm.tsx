import { FormEvent } from 'react';
import { Loader2, Pencil, Plus, X } from 'lucide-react';
import { AppAlert } from '@/src/components/common/AppAlert';

type Mode = 'create' | 'edit';

type AllergyFormProps = {
  mode: Mode;
  name: string;
  nameError?: string;
  isSaving: boolean;
  onNameChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onCancelEdit: () => void;
};

export function AllergyForm({
  mode,
  name,
  nameError,
  isSaving,
  onNameChange,
  onSubmit,
  onCancelEdit,
}: AllergyFormProps) {
  return (
    <div
      className={`rounded-xl border p-5 transition-all duration-200 ${
        mode === 'edit'
          ? 'border-brand-rose bg-brand-rose/5 ring-1 ring-brand-rose'
          : 'border-brand-line bg-white shadow-sm'
      }`}
    >
      <h2 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-brand-ink-soft">
        {mode === 'edit' ? <Pencil className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
        {mode === 'create' ? 'New Allergy' : 'Update Allergy'}
      </h2>

      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-1">
          <label className="ml-1 text-xs font-medium text-brand-ink-soft">Allergy Name</label>
          <input
            value={name}
            onChange={(event) => onNameChange(event.target.value)}
            placeholder="e.g. Nuts"
            className="h-11 w-full rounded-lg border border-brand-line px-3 text-brand-ink outline-none transition focus:border-brand-rose focus:ring-2 focus:ring-brand-rose/20"
            maxLength={80}
            required
          />
          <AppAlert message={nameError} />
        </div>

        <div className="flex flex-col gap-2">
          <button
            type="submit"
            disabled={isSaving || !name.trim()}
            className="flex h-11 items-center justify-center gap-2 rounded-lg bg-brand-rose px-4 font-semibold text-white transition hover:brightness-110 disabled:opacity-50"
          >
            {isSaving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : mode === 'create' ? (
              'Create Allergy'
            ) : (
              'Save Changes'
            )}
          </button>

          {mode === 'edit' && (
            <button
              type="button"
              onClick={onCancelEdit}
              className="flex h-11 items-center justify-center gap-2 rounded-lg border border-brand-line bg-white px-4 font-semibold text-brand-ink-soft transition hover:bg-gray-50"
            >
              <X className="h-4 w-4" />
              Cancel Edit
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
