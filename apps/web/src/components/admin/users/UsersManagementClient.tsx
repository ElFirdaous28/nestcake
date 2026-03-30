'use client';

import { FormEvent, useEffect, useState, useCallback, useMemo } from 'react';
import { ProfessionalVerificationStatus, UserRole } from '@shared-types';
import { useSearchParams } from 'next/navigation';
import { Loader2, Search } from 'lucide-react';
import { z } from 'zod';
import { usersService, type User } from '@/src/services/users.service';
import { professionalsService, type ProfessionalItem } from '@/src/services/professionals.service';
import { AppAlert } from '@/src/components/common/AppAlert';
import { UsersList } from './UsersList';

const usersSearchFormSchema = z.object({
  searchQuery: z.string().trim().max(100, 'Search query must be 100 characters or less.'),
});

export function UsersManagementClient() {
  const searchParams = useSearchParams();
  const [users, setUsers] = useState<User[]>([]);
  const [professionalByUserId, setProfessionalByUserId] = useState<
    Record<string, ProfessionalItem>
  >({});
  const [isSavingVerificationByUserId, setIsSavingVerificationByUserId] = useState<
    Record<string, boolean>
  >({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole | ''>('');
  const [pagination, setPagination] = useState({ skip: 0, limit: 50, total: 0, pages: 0 });

  const initialRole = useMemo<UserRole | ''>(() => {
    const roleParam = searchParams.get('role');

    if (
      roleParam === UserRole.CLIENT ||
      roleParam === UserRole.PROFESSIONAL ||
      roleParam === UserRole.ADMIN
    ) {
      return roleParam;
    }

    return '';
  }, [searchParams]);

  const loadUsers = useCallback(async (skip = 0, search = '', role = '') => {
    setError(null);
    setIsLoading(true);
    try {
      const [response, professionals] = await Promise.all([
        usersService.getAll({
          search: search || undefined,
          role: role || undefined,
          skip,
          limit: 50,
        }),
        professionalsService.getAll(),
      ]);

      const professionalMap = professionals.reduce<Record<string, ProfessionalItem>>(
        (acc, item) => {
          acc[item.userId] = item;
          return acc;
        },
        {},
      );

      setUsers(
        response.data.map((user) => ({
          ...user,
          id: user._id,
        })),
      );
      setProfessionalByUserId(professionalMap);
      setPagination(response.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load users');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    setSelectedRole(initialRole);
    loadUsers(0, '', initialRole as string);
  }, [loadUsers, initialRole]);

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const parsed = usersSearchFormSchema.safeParse({ searchQuery });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Invalid search query.');
      return;
    }

    loadUsers(0, parsed.data.searchQuery, selectedRole as string);
  };

  const handleRoleChange = async (role: UserRole | '') => {
    setSelectedRole(role);
    loadUsers(0, searchQuery, role as string);
  };

  const handleProfessionalVerificationChange = async (
    userId: string,
    status: ProfessionalVerificationStatus,
  ) => {
    const professional = professionalByUserId[userId];
    if (!professional) {
      return;
    }

    setError(null);
    setIsSavingVerificationByUserId((prev) => ({ ...prev, [userId]: true }));

    try {
      const updated = await professionalsService.updateVerification(professional.id, {
        verificationStatus: status,
      });

      setProfessionalByUserId((prev) => ({
        ...prev,
        [updated.userId]: updated,
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update verification status');
    } finally {
      setIsSavingVerificationByUserId((prev) => ({ ...prev, [userId]: false }));
    }
  };

  const handleNextPage = () => {
    if (pagination.skip + pagination.limit < pagination.total) {
      const newSkip = pagination.skip + pagination.limit;
      loadUsers(newSkip, searchQuery, selectedRole as string);
    }
  };

  const handlePrevPage = () => {
    if (pagination.skip > 0) {
      const newSkip = Math.max(0, pagination.skip - pagination.limit);
      loadUsers(newSkip, searchQuery, selectedRole as string);
    }
  };

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand-ink">Users Management</h1>
        <p className="mt-1 text-sm text-brand-ink-soft">
          Search and manage all users in the system
        </p>
      </div>

      <AppAlert message={error} />

      {/* Search and Filters */}
      <div className="space-y-4">
        <form onSubmit={handleSearch} className="flex gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-brand-ink-soft" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-brand-line rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-rose focus:border-transparent"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-brand-rose text-white rounded-lg font-medium hover:bg-brand-rose/90 transition"
          >
            Search
          </button>
        </form>

        <div className="flex gap-2 flex-wrap">
          <div className="text-sm font-medium text-brand-ink">Filter by role:</div>
          {['', UserRole.CLIENT, UserRole.PROFESSIONAL, UserRole.ADMIN].map((role) => (
            <button
              key={role || 'all'}
              onClick={() => handleRoleChange(role as UserRole | '')}
              className={`px-3 py-1 rounded-full text-sm font-medium transition ${
                selectedRole === role
                  ? 'bg-brand-rose text-white'
                  : 'bg-brand-cream-soft text-brand-ink hover:bg-brand-cream'
              }`}
            >
              {role ? role.charAt(0).toUpperCase() + role.slice(1) : 'All'}
            </button>
          ))}
        </div>
      </div>

      {/* Results info */}
      <div className="flex items-center justify-between text-sm text-brand-ink-soft">
        <div>
          Showing {pagination.skip + 1} to{' '}
          {Math.min(pagination.skip + pagination.limit, pagination.total)} of {pagination.total}{' '}
          users
        </div>
      </div>

      {/* Users List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 text-brand-rose animate-spin" />
        </div>
      ) : users.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 rounded-lg border border-dashed border-brand-line">
          <p className="text-brand-ink-soft">No users found</p>
        </div>
      ) : (
        <UsersList
          users={users}
          professionalByUserId={professionalByUserId}
          isSavingVerificationByUserId={isSavingVerificationByUserId}
          onChangeProfessionalVerification={handleProfessionalVerificationChange}
        />
      )}

      {/* Pagination */}
      {pagination.total > pagination.limit && (
        <div className="flex justify-between items-center pt-4 border-t border-brand-line">
          <button
            onClick={handlePrevPage}
            disabled={pagination.skip === 0}
            className="px-4 py-2 rounded-lg border border-brand-line text-brand-ink font-medium hover:bg-brand-cream-soft disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            Previous
          </button>
          <div className="text-sm text-brand-ink-soft">
            Page {Math.floor(pagination.skip / pagination.limit) + 1} of {pagination.pages}
          </div>
          <button
            onClick={handleNextPage}
            disabled={pagination.skip + pagination.limit >= pagination.total}
            className="px-4 py-2 rounded-lg bg-brand-rose text-white font-medium hover:bg-brand-rose/90 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            Next
          </button>
        </div>
      )}
    </section>
  );
}
