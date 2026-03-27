'use client';

import { LogOut } from 'lucide-react';
import { useAuth } from '@/src/hooks/useAuth';

export function LogoutButton() {
  const { logout } = useAuth();

  return (
    <button
      type="button"
      className="w-full flex items-center justify-center gap-2 rounded-lg bg-brand-danger px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 active:scale-95"
      onClick={() => void logout()}
    >
      <LogOut className="h-4 w-4" />
      Logout
    </button>
  );
}
