import { UserRole } from '@shared-types';
import { ProtectedRoute } from '@/src/components/auth/ProtectedRoute';
import { ClientSidebar } from '@/src/components/layouts/ClientSidebar';

export default function ClientLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ProtectedRoute allowedRoles={[UserRole.CLIENT]}>
      <div className="min-h-screen bg-brand-cream flex">
        <ClientSidebar />
        <main className="flex-1 p-6">
          <div className="rounded-2xl border border-brand-line bg-white p-6 shadow-sm">{children}</div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
