'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useEffect } from 'react';
import { useAuth } from '@/src/hooks/useAuth';
import { loginSchema, type LoginFormValues } from '@/src/lib/validation/authSchemas';

const inputClassName =
  'w-full rounded-xl border border-brand-line bg-brand-cream-soft px-4 py-3 text-brand-ink outline-none transition focus:ring-2 focus:ring-brand-rose/30';

export function LoginForm() {
  const router = useRouter();
  const { login, error, clearError, isLoading } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  useEffect(() => {
    clearError();
  }, [clearError]);

  const onSubmit = async (values: LoginFormValues) => {
    const ok = await login(values);
    if (ok) {
      router.push('/');
    }
  };

  return (
    <section className="flex min-h-screen items-center justify-center bg-linear-to-br from-brand-cream-soft via-brand-cream to-white px-4 py-10">
      <div className="w-full max-w-md rounded-3xl border border-brand-line bg-white p-8 shadow-[0_20px_60px_rgba(232,160,135,0.2)]">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-brand-rose">
          NestCake
        </p>
        <h1 className="mt-3 text-3xl font-bold text-brand-ink">
          Welcome Back
        </h1>
        <p className="mt-2 text-sm text-brand-ink-soft">
          Sign in to manage your requests, orders, and favorites.
        </p>

        <form className="mt-8 space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <div>
            <label className="mb-2 block text-sm font-medium text-brand-ink">
              Email
            </label>
            <input
              type="email"
              placeholder="you@example.com"
              className={inputClassName}
              {...register('email')}
            />
            {errors.email ? (
              <p className="mt-1 text-sm text-brand-danger">
                {errors.email.message}
              </p>
            ) : null}
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-brand-ink">
              Password
            </label>
            <input
              type="password"
              placeholder="At least 6 characters"
              className={inputClassName}
              {...register('password')}
            />
            {errors.password ? (
              <p className="mt-1 text-sm text-brand-danger">
                {errors.password.message}
              </p>
            ) : null}
          </div>

          {error ? (
            <p className="rounded-lg border border-brand-danger bg-brand-danger/10 px-3 py-2 text-sm text-brand-danger">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={isSubmitting || isLoading}
            className="w-full rounded-xl bg-brand-rose px-4 py-3 text-sm font-semibold text-brand-ink transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p className="mt-6 text-sm text-brand-ink-soft">
          New to NestCake?{' '}
          <Link href="/register" className="font-semibold underline text-brand-ink">
            Create an account
          </Link>
        </p>
      </div>
    </section>
  );
}
