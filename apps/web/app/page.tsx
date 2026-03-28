import Link from 'next/link';
import { HomeHero } from '@/src/components/common/HomeHero';

export default function Home() {
  return (
    <main className="min-h-screen bg-brand-cream px-4 py-12 sm:px-6 lg:px-8">
      <section className="mx-auto max-w-5xl">
        <HomeHero />

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/products"
            className="rounded-xl border border-brand-line px-6 py-3 text-center text-sm font-semibold text-brand-ink transition hover:opacity-90"
          >
            Browse Products
          </Link>
          <Link
            href="/register"
            className="rounded-xl bg-brand-rose px-6 py-3 text-center text-sm font-semibold text-brand-ink transition hover:opacity-90"
          >
            Create Account
          </Link>
          <Link
            href="/login"
            className="rounded-xl border border-brand-line px-6 py-3 text-center text-sm font-semibold text-brand-ink transition hover:opacity-90"
          >
            Login
          </Link>
        </div>
      </section>
    </main>
  );
}
