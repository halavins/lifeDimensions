import { importFromCSV } from './csvHandler';
import { createClient } from '@supabase/supabase-js';
import type { Goal as CsvGoal, Milestone, Dimension } from '../types';
import type { Goal as SupabaseGoal } from '../types/goal';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
const USER_ID = 'c0bb2a63-eb05-483b-8b9b-ddb70682b8d3';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error('Supabase URL and Anon Key must be set in environment variables.');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

function getYearForMonth(month: number): number {
  // Apr-Dec = 2025, Jan-Mar = 2026
  return month >= 1 && month <= 3 ? 2026 : 2025;
}

async function main() {
  const data = await importFromCSV();
  if (!data) {
    console.error('No data returned from importFromCSV');
    process.exit(1);
  }

  const goalsToInsert: Omit<SupabaseGoal, 'id' | 'created_at' | 'updated_at'>[] = [];

  // 1. Migrate milestones as monthly goals
  Object.entries(data.milestonesByDimension).forEach(([dimension, monthData]) => {
    Object.entries(monthData).forEach(([monthStr, milestoneTexts]) => {
      const month = parseInt(monthStr, 10);
      const completionStatus = data.dimensionCompletionStatus[dimension]?.milestones[month] || [];
      milestoneTexts.forEach((description, idx) => {
        if (description) {
          goalsToInsert.push({
            user_id: USER_ID,
            description,
            type: 'monthly',
            month,
            year: getYearForMonth(month),
            is_completed: completionStatus[idx] || false,
            order_index: idx, // 0, 1, 2 (max 3 per month per dimension)
          });
        }
      });
    });
  });

  // 2. Migrate annual goals
  Object.entries(data.goalsByDimension).forEach(([dimension, goalTexts]) => {
    const completionStatus = data.dimensionCompletionStatus[dimension]?.goals || [];
    goalTexts.forEach((description, idx) => {
      if (description) {
        goalsToInsert.push({
          user_id: USER_ID,
          description,
          type: 'annual',
          month: null,
          year: 2025, // All annual goals for 2025-2026 period
          is_completed: completionStatus[idx] || false,
          order_index: idx, // order in annual list for this dimension
        });
      }
    });
  });

  // Print for review
  console.log(JSON.stringify(goalsToInsert, null, 2));
  console.log(`Prepared ${goalsToInsert.length} goals for Supabase insertion.`);
}

main().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
}); 