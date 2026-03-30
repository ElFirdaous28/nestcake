'use client';

import Link from 'next/link';
import { UserRole } from '@shared-types';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { useAuth } from '@/src/hooks/useAuth';
import { registerSchema, type RegisterFormValues } from '@/src/lib/validation/authSchemas';
import { AppAlert } from '@/src/components/common/AppAlert';

const inputClassName =
  'w-full rounded-xl border border-brand-line bg-brand-cream-soft px-4 py-3 text-brand-ink outline-none transition focus:ring-2 focus:ring-brand-rose/30';

export function RegisterForm() {
  const router = useRouter();
  const { registerUser, registerProfessional, error, clearError, isLoading } = useAuth();

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      role: UserRole.CLIENT,
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: '',
      phone: '',
      businessName: '',
      description: '',
      latitude: '',
      longitude: '',
    },
  });

  const selectedRole = useWatch({
    control,
    name: 'role',
  });

  useEffect(() => {
    clearError();
  }, [clearError]);

  const onSubmit = async (values: RegisterFormValues) => {
    const basePayload = {
      firstName: values.firstName.trim(),
      lastName: values.lastName.trim(),
      email: values.email.trim().toLowerCase(),
      password: values.password,
      phone: values.phone?.trim() ? values.phone.trim() : undefined,
    };

    let ok = false;

    if (values.role === UserRole.PROFESSIONAL) {
      ok = await registerProfessional({
        ...basePayload,
        businessName: values.businessName?.trim() ?? '',
        description: values.description?.trim() ? values.description.trim() : undefined,
        location: {
          type: 'Point',
          coordinates: [Number(values.longitude), Number(values.latitude)],
        },
      });
    } else {
      ok = await registerUser(basePayload);
    }

    if (ok) {
      router.push('/');
    }
  };

  return (
    <section className="flex min-h-screen items-center justify-center bg-linear-to-br from-brand-cream to-brand-cream-soft to-80% px-4 py-10">
      <div className="w-full max-w-2xl rounded-3xl border border-brand-line bg-white p-8 shadow-[0_24px_80px_rgba(232,160,135,0.2)]">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-brand-rose">
          NestCake
        </p>
        <h1 className="mt-3 text-3xl font-bold text-brand-ink">Create Your Account</h1>
        <p className="mt-2 text-sm text-brand-ink-soft">
          Join as a client or as a professional baker.
        </p>

        <div className="mt-6 grid grid-cols-2 gap-2 rounded-2xl bg-brand-cream-soft border border-brand-line">
          <button
            type="button"
            onClick={() => setValue('role', UserRole.CLIENT)}
            className={`rounded-xl px-3 py-2 text-sm font-semibold text-brand-ink transition ${
              selectedRole === UserRole.CLIENT ? 'bg-brand-rose' : 'bg-transparent hover:bg-white'
            }`}
          >
            Client
          </button>
          <button
            type="button"
            onClick={() => setValue('role', UserRole.PROFESSIONAL)}
            className={`rounded-xl px-3 py-2 text-sm font-semibold text-brand-ink transition ${
              selectedRole === UserRole.PROFESSIONAL
                ? 'bg-brand-rose'
                : 'bg-transparent hover:bg-white'
            }`}
          >
            Professional
          </button>
        </div>

        <form className="mt-6 grid gap-4 sm:grid-cols-2" onSubmit={handleSubmit(onSubmit)}>
          <input type="hidden" {...register('role')} />

          <div>
            <label className="mb-2 block text-sm font-medium text-brand-ink">First name</label>
            <input className={inputClassName} {...register('firstName')} />
            <div className="mt-1">
              <AppAlert message={errors.firstName?.message} />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-brand-ink">Last name</label>
            <input className={inputClassName} {...register('lastName')} />
            <div className="mt-1">
              <AppAlert message={errors.lastName?.message} />
            </div>
          </div>

          <div className="sm:col-span-2">
            <label className="mb-2 block text-sm font-medium text-brand-ink">Email</label>
            <input type="email" className={inputClassName} {...register('email')} />
            <div className="mt-1">
              <AppAlert message={errors.email?.message} />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-brand-ink">Password</label>
            <input type="password" className={inputClassName} {...register('password')} />
            <div className="mt-1">
              <AppAlert message={errors.password?.message} />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-brand-ink">
              Confirm password
            </label>
            <input type="password" className={inputClassName} {...register('confirmPassword')} />
            <div className="mt-1">
              <AppAlert message={errors.confirmPassword?.message} />
            </div>
          </div>

          <div className="sm:col-span-2">
            <label className="mb-2 block text-sm font-medium text-brand-ink">
              Phone (optional)
            </label>
            <input className={inputClassName} {...register('phone')} />
            <div className="mt-1">
              <AppAlert message={errors.phone?.message} />
            </div>
          </div>

          {selectedRole === UserRole.PROFESSIONAL ? (
            <>
              <div className="sm:col-span-2">
                <label className="mb-2 block text-sm font-medium text-brand-ink">
                  Business name
                </label>
                <input className={inputClassName} {...register('businessName')} />
                <div className="mt-1">
                  <AppAlert message={errors.businessName?.message} />
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="mb-2 block text-sm font-medium text-brand-ink">
                  Description (optional)
                </label>
                <textarea className={inputClassName} rows={3} {...register('description')} />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-brand-ink">Latitude</label>
                <input
                  className={inputClassName}
                  placeholder="e.g. 25.2048"
                  {...register('latitude')}
                />
                <div className="mt-1">
                  <AppAlert message={errors.latitude?.message} />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-brand-ink">Longitude</label>
                <input
                  className={inputClassName}
                  placeholder="e.g. 55.2708"
                  {...register('longitude')}
                />
                <div className="mt-1">
                  <AppAlert message={errors.longitude?.message} />
                </div>
              </div>
            </>
          ) : null}

          <div className="sm:col-span-2">
            <AppAlert message={error} />
          </div>

          <button
            type="submit"
            disabled={isSubmitting || isLoading}
            className="sm:col-span-2 w-full rounded-xl bg-brand-rose px-4 py-3 text-sm font-semibold text-brand-ink transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p className="mt-6 text-sm text-brand-ink-soft">
          Already registered?{' '}
          <Link href="/login" className="font-semibold underline text-brand-ink">
            Sign in
          </Link>
        </p>
      </div>
    </section>
  );
}
