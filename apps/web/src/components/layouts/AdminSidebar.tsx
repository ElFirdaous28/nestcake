'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, ShieldCheck, Users } from 'lucide-react';
import { LogoutButton } from '@/src/components/auth/LogoutButton';
import { useAuth } from '@/src/hooks/useAuth';

const links = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/professionals', label: 'Professionals', icon: Users },
  { href: '/admin/reports', label: 'Reports', icon: ShieldCheck },
];

const isActivePath = (pathname: string, href: string) =>
  pathname === href || pathname.startsWith(`${href}/`);

export function AdminSidebar() {
  const pathname = usePathname();
  const { user } = useAuth();

  return (
    <aside className="w-64 border-r border-brand-line bg-white min-h-screen flex flex-col">
      <div className="p-5 border-b border-brand-line">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-ink-soft">NestCake</p>
        <h2 className="mt-2 text-lg font-bold text-brand-ink">Admin</h2>
      </div>

      <div className="p-4 border-b border-brand-line">
        <p className="text-xs text-brand-ink-soft">Signed in as</p>
        <p className="mt-1 text-sm font-semibold text-brand-ink truncate">{user?.email ?? 'admin'}</p>
      </div>

      <nav className="flex-1 p-3 overflow-y-auto">
        <ul className="space-y-2">
          {links.map((link) => {
            const Icon = link.icon;
            const active = isActivePath(pathname, link.href);

            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition ${
                    active
                      ? 'bg-brand-rose text-brand-ink'
                      : 'text-brand-ink-soft hover:bg-brand-cream-soft hover:text-brand-ink'
                  }`}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  <span>{link.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="p-4 border-t border-brand-line">
        <LogoutButton />
      </div>
    </aside>
  );
}
