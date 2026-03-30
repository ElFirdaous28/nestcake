'use client';

import { User } from '@/src/services/users.service';
import { X } from 'lucide-react';

interface UserDetailModalProps {
  user: User;
  isOpen: boolean;
  onClose: () => void;
}

export function UserDetailModal({ user, isOpen, onClose }: UserDetailModalProps) {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-50 bg-black/45" onClick={onClose} />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="bg-white rounded-2xl shadow-lg max-w-md w-full"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-brand-line p-6">
            <h2 className="text-lg font-bold text-brand-ink">User Details</h2>
            <button
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-brand-cream-soft text-brand-ink-soft hover:text-brand-ink transition"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-4">
            {/* Avatar */}
            {user.avatar && (
              <div className="flex justify-center mb-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`${process.env.NEXT_PUBLIC_API_URL}${user.avatar}`}
                  alt={`${user.firstName} ${user.lastName}`}
                  className="h-24 w-24 rounded-full object-cover border-2 border-brand-rose"
                />
              </div>
            )}

            {/* Details */}
            <div>
              <label className="text-sm font-semibold text-brand-ink-soft">Name</label>
              <p className="mt-1 text-brand-ink">
                {user.firstName} {user.lastName}
              </p>
            </div>

            <div>
              <label className="text-sm font-semibold text-brand-ink-soft">Email</label>
              <p className="mt-1 text-brand-ink break-all">{user.email}</p>
            </div>

            {user.phone && (
              <div>
                <label className="text-sm font-semibold text-brand-ink-soft">Phone</label>
                <p className="mt-1 text-brand-ink">{user.phone}</p>
              </div>
            )}

            <div>
              <label className="text-sm font-semibold text-brand-ink-soft">Role</label>
              <div className="mt-1">
                <span
                  className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    user.role === 'ADMIN'
                      ? 'bg-rose-100 text-rose-700'
                      : user.role === 'PROFESSIONAL'
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-sky-100 text-sky-700'
                  }`}
                >
                  {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                </span>
              </div>
            </div>

            {user.createdAt && (
              <div>
                <label className="text-sm font-semibold text-brand-ink-soft">Joined</label>
                <p className="mt-1 text-brand-ink">
                  {new Date(user.createdAt).toLocaleDateString()}
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-brand-line p-6 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-brand-cream-soft text-brand-ink font-medium hover:bg-brand-cream transition"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
