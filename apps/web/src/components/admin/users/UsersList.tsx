'use client';

import { useState } from 'react';
import { ProfessionalVerificationStatus, UserRole } from '@shared-types';
import { Eye, Mail, MoreVertical, Phone } from 'lucide-react';
import { type User } from '@/src/services/users.service';
import { type ProfessionalItem } from '@/src/services/professionals.service';
import { UserDetailModal } from './UserDetailModal';

interface UsersListProps {
    users: User[];
    professionalByUserId: Record<string, ProfessionalItem>;
    isSavingVerificationByUserId: Record<string, boolean>;
    onChangeProfessionalVerification: (
        userId: string,
        status: ProfessionalVerificationStatus,
    ) => Promise<void>;
}

const roleColorMap: Record<string, string> = {
    CLIENT: 'bg-sky-100 text-sky-700',
    PROFESSIONAL: 'bg-emerald-100 text-emerald-700',
    ADMIN: 'bg-rose-100 text-rose-700',
};

const verificationBadgeClass: Record<ProfessionalVerificationStatus, string> = {
    [ProfessionalVerificationStatus.PENDING]: 'bg-amber-100 text-amber-700',
    [ProfessionalVerificationStatus.VERIFIED]: 'bg-emerald-100 text-emerald-700',
    [ProfessionalVerificationStatus.REJECTED]: 'bg-rose-100 text-rose-700',
};

const verificationOptions = [
    ProfessionalVerificationStatus.PENDING,
    ProfessionalVerificationStatus.VERIFIED,
    ProfessionalVerificationStatus.REJECTED,
] as const;

const prettyLabel = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);

export function UsersList({
    users,
    professionalByUserId,
    isSavingVerificationByUserId,
    onChangeProfessionalVerification,
}: UsersListProps) {
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [openActionMenuId, setOpenActionMenuId] = useState<string | null>(null);

    return (
        <>
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
                            {users.map((user) => {
                                const roleStyle = roleColorMap[user.role] ?? 'bg-gray-100 text-gray-700';
                                const isActionMenuOpen = openActionMenuId === user._id;
                                const professional = user.role === UserRole.PROFESSIONAL
                                    ? professionalByUserId[user._id]
                                    : undefined;
                                const verificationStatus = professional?.verificationStatus;

                                return (
                                    <tr key={user._id} className="hover:bg-brand-cream/20 transition">
                                        <td className="px-6 py-4 text-sm font-medium text-brand-ink">
                                            <div className="flex gap-2">
                                                <span>
                                                    {user.firstName} {user.lastName}
                                                </span>
                                                {verificationStatus && (
                                                    <span
                                                        className={`inline-block w-fit px-2.5 py-0.5 rounded-full text-xs font-medium ${verificationBadgeClass[verificationStatus]}`}
                                                    >
                                                        {prettyLabel(verificationStatus)}
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-brand-ink-soft">{user.email}</td>
                                        <td className="px-6 py-4 text-sm text-brand-ink-soft">{user.phone || '-'}</td>
                                        <td className="px-6 py-4 text-sm">
                                            <span className={`inline-block w-fit px-2.5 py-0.5 rounded-full text-xs font-medium ${roleStyle}`}>
                                                {prettyLabel(user.role)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm">
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => setSelectedUser(user)}
                                                    className="p-1.5 rounded-lg text-brand-ink-soft hover:bg-brand-cream-soft hover:text-brand-rose transition"
                                                    title="View details"
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </button>
                                                <div className="relative">
                                                    <button
                                                        onClick={() =>
                                                            setOpenActionMenuId((prev) => (prev === user._id ? null : user._id))
                                                        }
                                                        className="p-1.5 rounded-lg text-brand-ink-soft hover:bg-brand-cream-soft hover:text-brand-rose transition"
                                                        title="Open actions"
                                                    >
                                                        <MoreVertical className="h-4 w-4" />
                                                    </button>
                                                    {isActionMenuOpen && (
                                                        <div className="absolute right-0 mt-1 w-48 bg-white border border-brand-line rounded-lg shadow-lg z-20 overflow-hidden">
                                                            <button
                                                                className="w-full px-4 py-2 text-left text-sm text-brand-ink-soft hover:bg-brand-cream-soft hover:text-brand-rose flex items-center gap-2 transition"
                                                                onClick={() => {
                                                                    window.location.href = `mailto:${user.email}`;
                                                                    setOpenActionMenuId(null);
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
                                                                        setOpenActionMenuId(null);
                                                                    }}
                                                                >
                                                                    <Phone className="h-4 w-4" />
                                                                    Call
                                                                </button>
                                                            )}

                                                            {professional && (
                                                                <>
                                                                    <div className="h-px bg-brand-line" />
                                                                    <div className="px-4 py-2 text-xs font-semibold uppercase tracking-wide text-brand-ink-soft">
                                                                        Verification
                                                                    </div>
                                                                    {verificationOptions.map((status) => (
                                                                        <button
                                                                            key={status}
                                                                            disabled={Boolean(isSavingVerificationByUserId[user._id])}
                                                                            className="w-full px-4 py-2 text-left text-sm text-brand-ink-soft hover:bg-brand-cream-soft hover:text-brand-rose disabled:opacity-50 disabled:cursor-not-allowed transition"
                                                                            onClick={async () => {
                                                                                await onChangeProfessionalVerification(user._id, status);
                                                                                setOpenActionMenuId(null);
                                                                            }}
                                                                        >
                                                                            Mark as {prettyLabel(status)}
                                                                        </button>
                                                                    ))}
                                                                </>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {selectedUser && (
                <UserDetailModal
                    user={selectedUser}
                    isOpen={Boolean(selectedUser)}
                    onClose={() => setSelectedUser(null)}
                />
            )}
        </>
    );
}
