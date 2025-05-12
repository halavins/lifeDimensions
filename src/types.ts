export type Dimension = 'family' | 'health' | 'wealth' | 'self-realization' | 'friends' | 'leisure';

export interface Goal {
  id: string;
  dimension: Dimension;
  description: string;
  completed: boolean;
  user_id?: string; // Added for consistency and future use
  // Add order_index if annual goals are also sortable, or for consistency
  // order_index?: number; 
}

export interface Milestone {
  id: string;
  user_id?: string; // Added to ensure it's available for RLS checks during updates
  dimension: Dimension;
  month: number; // 1-12
  description: string;
  completed: boolean;
  futureTense: string; // Or a more structured representation
  pastTense: string;   // Or a more structured representation
  order_index: number; // Added for dnd-kit sorting
}

export interface DimensionConfig {
  name: Dimension;
  color: string;
  icon: string;
  description: string;
}