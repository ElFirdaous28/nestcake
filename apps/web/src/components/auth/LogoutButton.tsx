'use client';

import { useAuth } from '@/src/hooks/useAuth';

export function LogoutButton() {
  const { logout } = useAuth();

  return (
    <button
      type="button"
      className="rounded-lg bg-brand-danger px-4 py-2 text-sm font-semibold text-brand-ink transition hover:opacity-90"
      onClick={() => void logout()}
    >
      Logout
    </button>
  );
}
