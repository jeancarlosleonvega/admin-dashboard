export const OPERATOR_LABELS: Record<string, string> = {
  EQ: 'igual a',
  NEQ: 'distinto de',
  GT: 'mayor que',
  GTE: 'mayor o igual que',
  LT: 'menor que',
  LTE: 'menor o igual que',
};

export const OPERATOR_DISPLAY: Record<string, string> = {
  EQ: '= igual a',
  NEQ: '≠ distinto de',
  GT: '> mayor que',
  GTE: '≥ mayor o igual que',
  LT: '< menor que',
  LTE: '≤ menor o igual que',
};

export const ALL_OPERATORS = ['EQ', 'NEQ', 'GT', 'GTE', 'LT', 'LTE'] as const;
