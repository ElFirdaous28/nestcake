'use client';

import { AuthProvider } from '@/src/contexts/AuthContext';

export function AppProviders({ children }: { children: React.ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}
