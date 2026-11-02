import { z } from 'zod';

export const registerSchema = z.object({
  body: z
    .object({
      name: z
        .string({ required_error: 'Full name is required' })
        .trim()
        .min(2, 'Name must be at least 2 characters')
        .max(100, 'Name cannot exceed 100 characters'),
      email: z
        .string({ required_error: 'Email is required' })
        .trim()
        .email('Please provide a valid email address')
        .toLowerCase(),
      password: z
        .string({ required_error: 'Password is required' })
        .min(6, 'Password must be at least 6 characters long'),
      confirmPassword: z
        .string({ required_error: 'Confirm password is required' }),
      department: z
        .string({ required_error: 'Department is required' })
        .trim()
        .min(2, 'Department name must be at least 2 characters'),
      semester: z.coerce
        .number({ required_error: 'Semester is required' })
        .min(1, 'Semester must be between 1 and 12')
        .max(12, 'Semester must be between 1 and 12'),
      studentId: z.string().trim().optional().default(''),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: 'Passwords do not match',
      path: ['confirmPassword'],
    }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z
      .string({ required_error: 'Email is required' })
      .trim()
      .email('Please provide a valid email address')
      .toLowerCase(),
    password: z
      .string({ required_error: 'Password is required' })
      .min(1, 'Password is required'),
  }),
});

export const updateProfileSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100).optional(),
    department: z.string().trim().min(2).optional(),
    semester: z.coerce.number().min(1).max(12).optional(),
    studentId: z.string().trim().optional(),
  }),
});

