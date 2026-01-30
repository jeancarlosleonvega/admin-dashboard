import { z } from 'zod';

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type PaginationParams = z.infer<typeof paginationSchema>;

export function getPaginationParams(query: unknown): PaginationParams {
  return paginationSchema.parse(query);
}

export function getSkipTake(params: PaginationParams) {
  return {
    skip: (params.page - 1) * params.limit,
    take: params.limit,
  };
}
