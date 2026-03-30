'use client';

import { useAuth } from '@/src/hooks/useAuth';
import { LogoutButton } from '@/src/components/auth/LogoutButton';

export function HomeHero() {
  const { user, isAuthenticated, isLoading } = useAuth();

  return (
    <div className="overflow-hidden rounded-3xl border border-brand-line bg-linear-to-br from-brand-cream-soft via-brand-cream to-white p-8 shadow-xl">
      <p className="text-xs font-bold uppercase tracking-[0.3em] text-brand-rose">NestCake</p>
      <h1 className="mt-3 text-4xl font-bold leading-tight text-brand-ink">
        Handmade celebration cakes, custom to every moment.
      </h1>
      <p className="mt-4 max-w-2xl text-base text-brand-ink-soft">
        Browse professionals, send requests, and manage your orders from one warm, bakery-inspired
        workspace.
      </p>

      <div className="mt-6 rounded-xl border border-brand-line px-4 py-3 text-sm">
        {isLoading ? (
          <p className="text-brand-ink-soft">Checking your session...</p>
        ) : isAuthenticated && user ? (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-brand-ink">
              Signed in as <strong>{user.email}</strong> ({user.role})
            </p>
            <LogoutButton />
          </div>
        ) : (
          <p className="text-brand-ink-soft">You are not signed in yet.</p>
        )}
      </div>
    </div>
  );
}
