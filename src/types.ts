export type Dimension = 'family' | 'health' | 'wealth' | 'self-realization' | 'friends' | 'leisure';

export interface Goal {
  id: string;
  dimension: Dimension;
  description: string;
  completed: boolean;
}

export interface Milestone {
  id: string;
  dimension: Dimension;
  month: number;
  description: string;
  completed: boolean;
  futureTense: string;
  pastTense: string;
}

export interface DimensionConfig {
  name: Dimension;
  color: string;
  icon: string;
  description: string;
}