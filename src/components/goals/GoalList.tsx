import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../hooks/useAuth'; // Or useAuthContext if you set it up
import type { Goal } from '../../types/goal';

export function GoalList() {
  const { currentUser } = useAuth(); // Or useAuthContext()
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchGoals() {
      if (!currentUser) {
        setGoals([]); // Clear goals if no user
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const { data, error: fetchError } = await supabase
          .from('goals')
          .select('*')
          .eq('user_id', currentUser.id)
          .order('year', { ascending: true })
          .order('month', { ascending: true, nullsFirst: false }) // Monthly before annual for same year
          .order('type', { ascending: false }) // annual goals usually shown first or grouped
          .order('order_index', { ascending: true });

        if (fetchError) throw fetchError;
        setGoals(data || []);
      } catch (e: any) {
        console.error('Error fetching goals:', e);
        setError(e.message || 'Failed to fetch goals.');
      } finally {
        setLoading(false);
      }
    }

    fetchGoals();
  }, [currentUser]); // Refetch when user changes

  if (loading) {
    return <p className="text-center text-gray-500">Loading goals...</p>;
  }

  if (error) {
    return <p className="text-center text-red-500">Error: {error}</p>;
  }

  if (!currentUser) {
    return null; // Or a message prompting login
  }

  if (goals.length === 0) {
    return <p className="text-center text-gray-500">No goals found. Start by adding some!</p>;
  }

  // Simple list display for now. You can format this into your grid later.
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold mb-4">Your Goals</h2>
        <ul className="space-y-2">
          {goals.map(goal => (
            <li key={goal.id} className={`p-4 rounded-md shadow ${goal.is_completed ? 'bg-green-100' : 'bg-white'}`}>
              <p className="font-medium">{goal.description}</p>
              <p className="text-sm text-gray-600">
                Type: {goal.type} | 
                {goal.type === 'monthly' && ` Month: ${goal.month},`}
                Year: {goal.year}
              </p>
              <p className="text-sm">
                Status: {goal.is_completed ? 'Completed' : 'Pending'}
              </p>
              {/* Add buttons/checkboxes for marking complete, editing, deleting later */}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
} 