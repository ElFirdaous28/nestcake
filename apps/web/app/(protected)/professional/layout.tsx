import { UserRole } from '@shared-types';
import { ProtectedRoute } from '@/src/components/auth/ProtectedRoute';

export default function ProfessionalLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <ProtectedRoute allowedRoles={[UserRole.PROFESSIONAL]}>{children}</ProtectedRoute>;
}
