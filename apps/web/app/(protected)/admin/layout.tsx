import { UserRole } from '@shared-types';
import { ProtectedRoute } from '@/src/components/auth/ProtectedRoute';
import { AdminSidebar } from '@/src/components/layouts/AdminSidebar';

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
      <div className="min-h-screen bg-brand-cream flex">
        <AdminSidebar />
        <main className="flex-1 p-6 pt-16 md:pt-6">
          <div className="mt-16 rounded-2xl border border-brand-line bg-white p-6 shadow-sm md:mt-0">{children}</div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
