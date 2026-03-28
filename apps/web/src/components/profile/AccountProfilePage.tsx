'use client';

import { UserRole } from '@shared-types';
import { useAuth } from '@/src/hooks/useAuth';
import { ProfessionalProfilePanel } from '@/src/components/professional/ProfessionalProfilePanel';

export function AccountProfilePage() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return null;
  }

  if (user?.role === UserRole.PROFESSIONAL) {
    return <ProfessionalProfilePanel />;
  }

  if (user?.role === UserRole.CLIENT) {
    return (
      <section className="space-y-2">
        <h1 className="text-2xl font-bold text-brand-ink">Client Profile</h1>
        <p className="text-brand-ink-soft">Account: {user.email}</p>
      </section>
    );
  }

  return (
    <section className="space-y-2">
      <h1 className="text-2xl font-bold text-brand-ink">Admin Profile</h1>
      <p className="text-brand-ink-soft">Account: {user?.email ?? 'admin'}</p>
    </section>
  );
}
