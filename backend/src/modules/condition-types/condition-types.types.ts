export interface AllowedValueItem {
  value: string;
  label: string;
}

export interface ConditionType {
  id: string;
  name: string;
  key: string;
  dataType: 'NUMBER' | 'STRING' | 'UUID' | 'ENUM';
  allowedOperators: string[];
  allowedValues: AllowedValueItem[] | null;
  isSystem: boolean;
  description: string | null;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}
