'use client';

import { useState } from 'react';
import { Eye, MoreVertical, Mail, Phone } from 'lucide-react';
import { User } from '@/src/services/users.service';
import { UserDetailModal } from './UserDetailModal';

interface UserListItemProps {
  user: User;
}

export function UserListItem({ user }: UserListItemProps) {
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [openActionMenu, setOpenActionMenu] = useState(false);

  const roleColor = {
    CLIENT: 'bg-sky-100 text-sky-700',
    PROFESSIONAL: 'bg-emerald-100 text-emerald-700',
    ADMIN: 'bg-rose-100 text-rose-700',
  };

  const getRoleColor = (role: string) => roleColor[role as keyof typeof roleColor] || 'bg-gray-100 text-gray-700';

  return (
    <>
      <tr className="hover:bg-brand-cream/20 transition">
        <td className="px-6 py-4 text-sm font-medium text-brand-ink">
          {user.firstName} {user.lastName}
        </td>
        <td className="px-6 py-4 text-sm text-brand-ink-soft">{user.email}</td>
        <td className="px-6 py-4 text-sm text-brand-ink-soft">{user.phone || '-'}</td>
        <td className="px-6 py-4 text-sm">
          <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
            {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
          </span>
        </td>
        <td className="px-6 py-4 text-sm">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowDetailModal(true)}
              className="p-1.5 rounded-lg text-brand-ink-soft hover:bg-brand-cream-soft hover:text-brand-rose transition"
              title="View details"
            >
              <Eye className="h-4 w-4" />
            </button>
            <div className="relative">
              <button
                onClick={() => setOpenActionMenu(!openActionMenu)}
                className="p-1.5 rounded-lg text-brand-ink-soft hover:bg-brand-cream-soft hover:text-brand-rose transition"
              >
                <MoreVertical className="h-4 w-4" />
              </button>
              {openActionMenu && (
                <div className="absolute right-0 mt-1 w-48 bg-white border border-brand-line rounded-lg shadow-lg z-20 overflow-hidden">
                  <button
                    className="w-full px-4 py-2 text-left text-sm text-brand-ink-soft hover:bg-brand-cream-soft hover:text-brand-rose flex items-center gap-2 transition"
                    onClick={() => {
                      window.location.href = `mailto:${user.email}`;
                      setOpenActionMenu(false);
                    }}
                  >
                    <Mail className="h-4 w-4" />
                    Send Email
                  </button>
                  {user.phone && (
                    <button
                      className="w-full px-4 py-2 text-left text-sm text-brand-ink-soft hover:bg-brand-cream-soft hover:text-brand-rose flex items-center gap-2 transition"
                      onClick={() => {
                        window.location.href = `tel:${user.phone}`;
                        setOpenActionMenu(false);
                      }}
                    >
                      <Phone className="h-4 w-4" />
                      Call
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </td>
      </tr>

      <UserDetailModal user={user} isOpen={showDetailModal} onClose={() => setShowDetailModal(false)} />
    </>
  );
}
