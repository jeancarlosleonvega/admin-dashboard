export interface AdditionalService {
  id: string;
  sportTypeId?: string | null;
  name: string;
  description?: string | null;
  price: number;
  active: boolean;
  createdAt: string;
  sportType?: { id: string; name: string } | null;
}
