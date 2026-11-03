import { z } from 'zod';

export const createSubjectSchema = z.object({
  body: z.object({
    name: z
      .string({ error: 'Subject name is required' })
      .trim()
      .min(2, 'Subject name must be at least 2 characters')
      .max(100, 'Subject name cannot exceed 100 characters'),
    code: z
      .string({ error: 'Subject code is required' })
      .trim()
      .min(2, 'Subject code must be at least 2 characters')
      .max(20, 'Subject code cannot exceed 20 characters')
      .toUpperCase(),
    semester: z.coerce
      .number({ error: 'Semester is required' })
      .min(1, 'Semester must be between 1 and 12')
      .max(12, 'Semester must be between 1 and 12'),
    description: z.string().trim().max(1000).optional().default(''),
  }),
});

export const updateSubjectSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Subject ID format'),
  }),
  body: z.object({
    name: z.string().trim().min(2).max(100).optional(),
    code: z.string().trim().min(2).max(20).toUpperCase().optional(),
    semester: z.coerce.number().min(1).max(12).optional(),
    description: z.string().trim().max(1000).optional(),
    isActive: z.boolean().optional(),
  }),
});

