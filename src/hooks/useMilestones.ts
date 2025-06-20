import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import type { Milestone, Goal, Dimension } from '../types';

const DEFAULT_USER_ID = 'c0bb2a63-eb05-483b-8b9b-ddb70682b8d3';

export function useMilestones() {
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);

  useEffect(() => {
    const loadSupabaseData = async () => {
      try {
        const { data, error } = await supabase
          .from('goals')
          .select('*')
          .eq('user_id', DEFAULT_USER_ID)
          .order('order_index', { ascending: true });
        if (error) throw error;
        if (data) {
          const newMilestones: Milestone[] = [];
          const newGoals: Goal[] = [];
          data.forEach((row: any) => {
            const dimension = row.dimension as Dimension;
            if (row.type === 'monthly') {
              newMilestones.push({
                id: row.id,
                user_id: row.user_id,
                dimension: dimension,
                month: row.month,
                description: row.description,
                completed: row.is_completed,
                futureTense: row.description,
                pastTense: row.description,
                order_index: row.order_index,
              });
            } else if (row.type === 'annual') {
              newGoals.push({
                id: row.id,
                user_id: row.user_id,
                dimension: dimension,
                description: row.description,
                completed: row.is_completed,
              });
            }
          });
          setMilestones(newMilestones);
          setGoals(newGoals);
        }
      } catch (error) {
        console.error('Error loading Supabase data:', error);
      }
    };
    loadSupabaseData();
  }, []);

  useEffect(() => {
    console.log("Current app state:", {
      milestonesL: milestones.length,
      goalsL: goals.length,
      loadedFrom: 'supabase'
    });
  }, [milestones, goals]);

  const addMilestone = async (newMilestoneData: Omit<Milestone, 'id' | 'order_index' | 'user_id'>) => {
    const { data: userResponse } = await supabase.auth.getUser();
    const userId = userResponse?.user?.id || DEFAULT_USER_ID;
    const tempId = `temp-${Date.now()}`;

    const itemsInCell = milestones.filter(m => m.dimension === newMilestoneData.dimension && m.month === newMilestoneData.month);
    const newOrderIndex = itemsInCell.length;

    const milestoneToInsertForUI: Milestone = {
      ...newMilestoneData,
      id: tempId, 
      user_id: userId,
      order_index: newOrderIndex,
      futureTense: newMilestoneData.description, 
      pastTense: newMilestoneData.description,
    };
    setMilestones(prev => [...prev, milestoneToInsertForUI].sort((a,b) => a.dimension.localeCompare(b.dimension) || a.month - b.month || a.order_index - b.order_index));

    try {
      const { data, error } = await supabase
        .from('goals')
        .insert({
          user_id: userId,
          description: newMilestoneData.description,
          type: 'monthly',
          month: newMilestoneData.month,
          year: newMilestoneData.month < 4 ? 2026 : 2025, 
          is_completed: false,
          order_index: newOrderIndex,
          dimension: newMilestoneData.dimension,
        })
        .select()
        .single();

      if (error) throw error;
      if (data) {
        setMilestones(prev => prev.map(m => m.id === tempId ? { ...m, id: data.id, user_id: data.user_id } : m));
      }
    } catch (error) {
      console.error('Error adding milestone to Supabase:', error);
      setMilestones(prev => prev.filter(m => m.id !== tempId)); 
      alert('Failed to add milestone.');
    }
  };

  const toggleMilestoneCompletion = async (milestone: Milestone) => {
    const newCompletedStatus = !milestone.completed;
    setMilestones(prev =>
      prev.map(m =>
        m.id === milestone.id ? { ...m, completed: newCompletedStatus } : m
      )
    );
    try {
      const { error } = await supabase
        .from('goals')
        .update({ is_completed: newCompletedStatus })
        .eq('id', milestone.id);
      if (error) {
        console.error('Error updating milestone completion in Supabase (from tap):', error);
        setMilestones(prev =>
          prev.map(m =>
            m.id === milestone.id ? { ...m, completed: !newCompletedStatus } : m 
          )
        );
        alert('Failed to update milestone status.');
      }
    } catch (e) {
      console.error('Supabase call failed (from tap):', e);
      setMilestones(prev =>
        prev.map(m =>
          m.id === milestone.id ? { ...m, completed: !newCompletedStatus } : m 
        )
      );
      alert('An unexpected error occurred updating status.');
    }
  };

  const deleteMilestone = async (milestoneToDelete: Milestone) => {
    const originalMilestones = [...milestones];
    setMilestones(prev => prev.filter(m => m.id !== milestoneToDelete.id));

    try {
      const { error } = await supabase.from('goals').delete().eq('id', milestoneToDelete.id);
      if (error) {
        console.error('Error deleting milestone from Supabase:', error);
        setMilestones(originalMilestones); 
        alert('Failed to delete milestone. Please try again.');
        return;
      }
    } catch (e) {
      console.error('Supabase call failed for delete:', e);
      setMilestones(originalMilestones); 
      alert('An unexpected error occurred while deleting. Please try again.');
    }
  };

  const updateMilestoneDescription = async (milestoneId: string, newDescription: string) => {
    const originalMilestone = milestones.find(m => m.id === milestoneId);
    if (!originalMilestone) {
      console.error('Cannot update description, milestone not found');
      return false;
    }

    // Check if text actually changed
    if (originalMilestone.description === newDescription.trim()) {
      return true;
    }

    const updatedMilestone = { ...originalMilestone, description: newDescription.trim() };

    // Optimistic UI Update
    setMilestones(prev => prev.map(m => m.id === milestoneId ? updatedMilestone : m));

    try {
      const { error } = await supabase
        .from('goals')
        .update({ description: updatedMilestone.description })
        .eq('id', milestoneId);
      if (error) {
        console.error('Error updating milestone description in Supabase:', error);
        // Revert UI change on error
        setMilestones(prev => prev.map(m => m.id === milestoneId ? originalMilestone : m));
        alert('Failed to save milestone changes.');
        return false;
      }
      return true;
    } catch (e) {
      console.error('Supabase call failed for description update:', e);
      setMilestones(prev => prev.map(m => m.id === milestoneId ? originalMilestone : m));
      alert('An unexpected error occurred while saving changes.');
      return false;
    }
  };

  return {
    milestones,
    goals,
    setMilestones,
    setGoals,
    addMilestone,
    toggleMilestoneCompletion,
    deleteMilestone,
    updateMilestoneDescription,
  };
}