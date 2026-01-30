export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface IdParam {
  id: string;
}

export type SortOrder = 'asc' | 'desc';
