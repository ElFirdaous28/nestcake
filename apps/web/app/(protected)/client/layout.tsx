import { UserRole } from '@shared-types';
import { ProtectedRoute } from '@/src/components/auth/ProtectedRoute';

export default function ClientLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <ProtectedRoute allowedRoles={[UserRole.CLIENT]}>{children}</ProtectedRoute>;
}
