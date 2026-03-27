'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, ShieldCheck, Users, Menu, X, Tags } from 'lucide-react';
import { useAuth } from '@/src/hooks/useAuth';
import { Logo } from '@/src/components/common/Logo';
import { SidebarAccountSection } from '@/src/components/layouts/SidebarAccountSection';

const links = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/categories', label: 'Categories', icon: Tags },
  { href: '/admin/professionals', label: 'Professionals', icon: Users },
  { href: '/admin/reports', label: 'Reports', icon: ShieldCheck },
];

const isActivePath = (pathname: string, href: string) =>
  pathname === href || pathname.startsWith(`${href}/`);

export function AdminSidebar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Mobile Hamburger */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="fixed top-4 left-4 z-50 md:hidden p-2 rounded-lg bg-brand-rose text-white"
        aria-label="Toggle menu"
      >
        {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </button>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 md:hidden bg-black/50"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed md:static top-0 left-0 z-40 w-64 border-r border-brand-line bg-white min-h-screen flex flex-col transition-transform md:transition-none ${
        mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      }`}>
        <div className="p-6 border-b border-brand-line bg-linear-to-br from-white to-brand-cream/50">
          <Logo />
          <h2 className="mt-3 text-lg font-bold text-brand-ink">Admin Portal</h2>
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

      <SidebarAccountSection
        email={user?.email}
        avatar={user?.avatar}
        profileHref="/profile"
        fallbackInitial="A"
      />
      </aside>
    </>
  );
}
