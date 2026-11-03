import { z } from 'zod';

export const createResourceSchema = z.object({
  body: z.object({
    title: z
      .string({ error: 'Resource title is required' })
      .trim()
      .min(3, 'Title must be at least 3 characters')
      .max(200, 'Title cannot exceed 200 characters'),
    description: z.string().trim().max(2000).optional().default(''),
    subject: z
      .string({ error: 'Subject is required' })
      .regex(/^[0-9a-fA-F]{24}$/, 'Invalid Subject ID format'),
    semester: z.coerce
      .number({ error: 'Semester is required' })
      .min(1, 'Semester must be between 1 and 12')
      .max(12, 'Semester must be between 1 and 12'),
    type: z.enum(
      ['PDF', 'PPT', 'DOC', 'DOCX', 'Notes', 'Assignment', 'Reference Link', 'Other'],
      { error: 'Resource type is required' }
    ),
    tags: z
      .union([
        z.array(z.string().trim()).max(10),
        z.string().transform((str) =>
          str
            .split(',')
            .map((t) => t.trim())
            .filter(Boolean)
        ),
      ])
      .optional()
      .default([]),
    resourceUrl: z
      .string()
      .trim()
      .min(1, 'Resource URL or file is required')
      .optional(),
  }),
});

export const updateResourceSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Resource ID format'),
  }),
  body: z.object({
    title: z.string().trim().min(3).max(200).optional(),
    description: z.string().trim().max(2000).optional(),
    subject: z.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
    semester: z.coerce.number().min(1).max(12).optional(),
    type: z
      .enum(['PDF', 'PPT', 'DOC', 'DOCX', 'Notes', 'Assignment', 'Reference Link', 'Other'])
      .optional(),
    tags: z
      .union([
        z.array(z.string().trim()),
        z.string().transform((str) =>
          str
            .split(',')
            .map((t) => t.trim())
            .filter(Boolean)
        ),
      ])
      .optional(),
    resourceUrl: z.string().trim().optional(),
    status: z.enum(['pending', 'approved', 'rejected']).optional(),
    verificationStatus: z.enum(['unverified', 'verified', 'reported']).optional(),
  }),
});

