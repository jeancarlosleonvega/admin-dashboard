export interface SportType {
  id: string;
  name: string;
  description: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SportTypeFilters {
  search?: string;
  active?: 'true' | 'false';
  page?: number;
  limit?: number;
}
