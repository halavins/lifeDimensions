import { supabase } from '../supabaseClient';
import type { Goal, Dimension } from '../types';

const DEFAULT_USER_ID = 'c0bb2a63-eb05-483b-8b9b-ddb70682b8d3';

export function useGoals(goals: Goal[], setGoals: React.Dispatch<React.SetStateAction<Goal[]>>) {
  const toggleGoalCompletion = async (goal: Goal) => {
    const newCompletedStatus = !goal.completed;
    setGoals(prev =>
      prev.map(g =>
        g.id === goal.id ? { ...g, completed: newCompletedStatus } : g
      )
    );
    try {
      const { error } = await supabase
        .from('goals') 
        .update({ is_completed: newCompletedStatus, type: 'annual' })
        .eq('id', goal.id);
      if (error) {
        console.error('Error updating annual goal completion in Supabase:', error);
        setGoals(prev =>
          prev.map(g =>
            g.id === goal.id ? { ...g, completed: goal.completed } : g 
          )
        );
        alert('Failed to update annual goal. Please try again.');
      }
    } catch (e) {
      console.error('Supabase call failed for annual goal:', e);
      setGoals(prev =>
        prev.map(g =>
          g.id === goal.id ? { ...g, completed: goal.completed } : g
        )
      );
      alert('An unexpected error occurred with annual goal. Please try again.');
    }
  };

  const addGoal = async (dimension: Dimension, description: string) => {
    const { data: userResponse } = await supabase.auth.getUser();
    const userId = userResponse?.user?.id || DEFAULT_USER_ID;
    const tempId = `temp-goal-${Date.now()}`;

    const goalToInsertForUI: Goal = {
      id: tempId,
      user_id: userId,
      dimension: dimension,
      description,
      completed: false,
    };
    setGoals(prev => [...prev, goalToInsertForUI]);

    try {
      const { data, error } = await supabase
        .from('goals')
        .insert({
          user_id: userId,
          description: description,
          type: 'annual',
          year: 2025, 
          is_completed: false,
          dimension: dimension,
        })
        .select()
        .single();
      if (error) throw error;
      if (data) {
        setGoals(prev => prev.map(g => g.id === tempId ? { ...g, id: data.id, user_id: data.user_id } : g));
      }
    } catch (error) {
      console.error('Error adding annual goal to Supabase:', error);
      setGoals(prev => prev.filter(g => g.id !== tempId));
      alert('Failed to add annual goal.');
    }
  };

  const deleteGoal = async (goalToDelete: Goal) => {
    const originalGoals = [...goals];
    setGoals(prev => prev.filter(g => g.id !== goalToDelete.id));
    try {
      const {error} = await supabase.from('goals').delete().eq('id', goalToDelete.id);
      if(error){
        console.error('Error deleting annual goal from Supabase:', error);
        setGoals(originalGoals);
        alert('Failed to delete annual goal. Please try again.');
      }
    } catch (e) {
      console.error('Supabase call failed for annual goal delete:', e);
      setGoals(originalGoals);
      alert('An unexpected error occurred while deleting annual goal.');
    }
  };

  return {
    toggleGoalCompletion,
    addGoal,
    deleteGoal,
  };
}