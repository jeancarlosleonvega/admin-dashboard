export interface ConditionType {
  id: string;
  name: string;
  key: string;
  dataType: 'NUMBER' | 'STRING' | 'UUID' | 'ENUM';
  allowedOperators: string[];
  description: string | null;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}
