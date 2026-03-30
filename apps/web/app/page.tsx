import Link from 'next/link';
import { Logo } from '@/src/components/common/Logo';

export default function Home() {
  return (
    <main className="min-h-screen bg-linear-to-b from-brand-cream via-brand-cream-soft to-brand-cream">
      <header className="border-b border-brand-line/80 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Logo />
          <nav className="hidden items-center gap-6 text-sm font-medium text-brand-ink-soft sm:flex">
            <Link href="/products" className="transition hover:text-brand-ink">
              Products
            </Link>
            <Link href="/register" className="transition hover:text-brand-ink">
              Join
            </Link>
            <Link href="/login" className="transition hover:text-brand-ink">
              Login
            </Link>
          </nav>
        </div>
      </header>

      <section className="px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-brand-rose">
              Welcome to NestCake
            </p>
            <h1 className="mt-4 text-4xl font-bold leading-tight text-brand-ink sm:text-5xl">
              Order beautiful cakes without the back-and-forth.
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-7 text-brand-ink-soft sm:text-base">
              Discover ready products, request custom designs, and manage everything in one place.
              Clean for clients, useful for professionals.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/products"
                className="rounded-xl bg-brand-rose px-6 py-3 text-center text-sm font-semibold text-brand-ink transition hover:opacity-90"
              >
                Start Browsing
              </Link>
              <Link
                href="/register"
                className="rounded-xl border border-brand-line bg-white px-6 py-3 text-center text-sm font-semibold text-brand-ink transition hover:bg-brand-cream-soft"
              >
                Create Account
              </Link>
            </div>
          </div>

          <div className="rounded-3xl border border-brand-line bg-white p-6 shadow-sm sm:p-8">
            <h2 className="text-lg font-semibold text-brand-ink">Why people use NestCake</h2>
            <div className="mt-4 space-y-3">
              <div className="rounded-xl border border-brand-line bg-brand-cream p-4">
                <p className="text-sm font-semibold text-brand-ink">Fast Product Search</p>
                <p className="mt-1 text-xs text-brand-ink-soft">
                  Filter and sort products to quickly find the right option.
                </p>
              </div>
              <div className="rounded-xl border border-brand-line bg-brand-cream p-4">
                <p className="text-sm font-semibold text-brand-ink">Role Dashboards</p>
                <p className="mt-1 text-xs text-brand-ink-soft">
                  Clients and professionals land in their own workspace after login.
                </p>
              </div>
              <div className="rounded-xl border border-brand-line bg-brand-cream p-4">
                <p className="text-sm font-semibold text-brand-ink">Simple Workflow</p>
                <p className="mt-1 text-xs text-brand-ink-soft">
                  Requests, proposals, and orders organized in one platform.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 pb-14 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl rounded-3xl border border-brand-line bg-white p-6 shadow-sm sm:p-8">
          <h2 className="text-2xl font-bold text-brand-ink">How It Works</h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-brand-line bg-brand-cream p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-brand-rose">Step 1</p>
              <p className="mt-2 text-sm font-semibold text-brand-ink">Browse products</p>
            </div>
            <div className="rounded-2xl border border-brand-line bg-brand-cream p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-brand-rose">Step 2</p>
              <p className="mt-2 text-sm font-semibold text-brand-ink">Place request or order</p>
            </div>
            <div className="rounded-2xl border border-brand-line bg-brand-cream p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-brand-rose">Step 3</p>
              <p className="mt-2 text-sm font-semibold text-brand-ink">Track from dashboard</p>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-brand-line bg-white/80 px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-6xl gap-8 text-sm text-brand-ink-soft md:grid-cols-[1.3fr_1fr_1fr]">
          <div>
            <Logo />
            <p className="mt-3 max-w-xs text-xs leading-6">
              NestCake helps clients and professionals manage cake orders, requests, and updates in
              one simple platform.
            </p>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-ink">
              Quick Links
            </p>
            <div className="mt-3 flex flex-col gap-2 text-xs">
              <Link href="/" className="transition hover:text-brand-ink">
                Home
              </Link>
              <Link href="/products" className="transition hover:text-brand-ink">
                Products
              </Link>
              <Link href="/login" className="transition hover:text-brand-ink">
                Login
              </Link>
              <Link href="/register" className="transition hover:text-brand-ink">
                Register
              </Link>
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-ink">
              Contact Us
            </p>
            <div className="mt-3 space-y-2 text-xs">
              <p>hello@nestcake.app</p>
              <p>+1 (555) 123-8800</p>
              <p>128 Baker Street, Sweet City</p>
              <p>Mon - Sat, 9:00 AM - 8:00 PM</p>
            </div>
          </div>
        </div>

        <div className="mx-auto mt-6 max-w-6xl border-t border-brand-line pt-4 text-xs text-brand-ink-soft">
          <p>© 2026 NestCake. Built for sweet celebrations.</p>
        </div>
      </footer>
    </main>
  );
}
