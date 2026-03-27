import { UserRole } from '@shared-types';
import { ProtectedRoute } from '@/src/components/auth/ProtectedRoute';
import { ProfessionalSidebar } from '@/src/components/layouts/ProfessionalSidebar';

export default function ProfessionalLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ProtectedRoute allowedRoles={[UserRole.PROFESSIONAL]}>
      <div className="min-h-screen bg-brand-cream flex">
        <ProfessionalSidebar />
        <main className="flex-1 p-6">
          <div className="rounded-2xl border border-brand-line bg-white p-6 shadow-sm">{children}</div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
