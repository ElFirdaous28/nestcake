'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronDown } from 'lucide-react';
import { LogoutButton } from '@/src/components/auth/LogoutButton';

type SidebarAccountSectionProps = {
  email?: string;
  avatar?: string;
  profileHref: string;
  fallbackInitial: string;
};

const getInitials = (email?: string, fallbackInitial = 'U') => {
  if (!email) {
    return fallbackInitial.toUpperCase();
  }

  return email.substring(0, 2).toUpperCase();
};

export function SidebarAccountSection({
  email,
  avatar,
  profileHref,
  fallbackInitial,
}: SidebarAccountSectionProps) {
  const [accountOpen, setAccountOpen] = useState(false);

  return (
    <div className="border-t border-brand-line">
      <button
        type="button"
        onClick={() => setAccountOpen((prev) => !prev)}
        className="w-full px-6 py-4 flex items-center gap-3 text-left hover:bg-brand-cream-soft transition"
      >
        {avatar ? (
          <img
            src={avatar}
            alt="Avatar"
            className="h-10 w-10 rounded-full object-cover shrink-0"
          />
        ) : (
          <div className="h-10 w-10 rounded-full bg-brand-rose flex items-center justify-center shrink-0">
            <span className="text-xs font-bold text-white">{getInitials(email, fallbackInitial)}</span>
          </div>
        )}

        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-brand-ink-soft">Account</p>
          <p className="mt-1 text-sm font-semibold text-brand-ink truncate">{email ?? 'user'}</p>
        </div>

        <ChevronDown
          className={`h-4 w-4 text-brand-ink-soft transition-transform ${accountOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {accountOpen && (
        <div className="px-6 pb-4 space-y-2">
          <Link
            href={profileHref}
            className="block w-full rounded-lg border border-brand-line px-3 py-2 text-sm font-semibold text-brand-ink-soft hover:text-brand-ink hover:bg-brand-cream-soft transition"
          >
            Profile
          </Link>
          <LogoutButton />
        </div>
      )}
    </div>
  );
}
