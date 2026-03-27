import { redirect } from 'next/navigation';

export default function AdminProfessionalsPage() {
  redirect('/admin/users?role=PROFESSIONAL');
}
