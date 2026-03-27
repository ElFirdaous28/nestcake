'use client';

import { User } from '@/src/services/users.service';
import { UserListItem } from './UserListItem';

interface UsersListProps {
  users: User[];
}

export function UsersList({ users }: UsersListProps) {
  return (
    <div className="border border-brand-line rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-brand-line bg-brand-cream/30">
              <th className="px-6 py-3 text-left text-sm font-semibold text-brand-ink">Name</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-brand-ink">Email</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-brand-ink">Phone</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-brand-ink">Role</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-brand-ink">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-line">
            {users.map((user) => (
              <UserListItem key={user._id} user={user} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
