import { z } from 'zod';

const requiredText = (label: string) =>
  z
    .string()
    .trim()
    .min(1, `${label} is required`);

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const registerSchema = z
  .object({
    role: z.enum(['CLIENT', 'PROFESSIONAL']),
    firstName: requiredText('First name'),
    lastName: requiredText('Last name'),
    email: z
      .string()
      .trim()
      .min(1, 'Email is required')
      .email('Please enter a valid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string().min(6, 'Please confirm your password'),
    phone: z
      .string()
      .trim()
      .optional()
      .refine(
        (val) => !val || /^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,9}$/.test(val),
        'Please enter a valid phone number'
      ),
    businessName: z.string().trim().optional(),
    description: z.string().trim().optional(),
    latitude: z.string().trim().optional(),
    longitude: z.string().trim().optional(),
  })
  .superRefine((values, ctx) => {
    if (values.password !== values.confirmPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Passwords do not match',
        path: ['confirmPassword'],
      });
    }

    if (values.role === 'PROFESSIONAL') {
      if (!values.businessName) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Business name is required',
          path: ['businessName'],
        });
      }

      if (!values.latitude) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Latitude is required',
          path: ['latitude'],
        });
      }

      if (!values.longitude) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Longitude is required',
          path: ['longitude'],
        });
      }

      if (values.latitude && Number.isNaN(Number(values.latitude))) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Latitude must be a number',
          path: ['latitude'],
        });
      }

      if (values.longitude && Number.isNaN(Number(values.longitude))) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Longitude must be a number',
          path: ['longitude'],
        });
      }
    }
  });

export type LoginFormValues = z.infer<typeof loginSchema>;
export type RegisterFormValues = z.infer<typeof registerSchema>;
