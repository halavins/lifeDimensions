import React, { useState, useEffect, useRef } from 'react';
import { Grid } from './components/Grid';
import { Sidebar } from './components/Sidebar';
import { GoalModal } from './components/GoalModal';
import { Target, Plus } from 'lucide-react';
import type { Milestone, Goal, Dimension } from './types';
import { supabase } from './supabaseClient';
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  UniqueIdentifier,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from '@dnd-kit/core';
import { arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable';

const DEFAULT_USER_ID = 'c0bb2a63-eb05-483b-8b9b-ddb70682b8d3';
const TAP_THRESHOLD_MS = 250;
const TAP_DISTANCE_THRESHOLD_PX = 10;
const LONG_PRESS_THRESHOLD_MS = 500;

function MilestoneOverlayItem({ item }: { item: Milestone }) {
  return (
    <div className="p-1 sm:p-1.5 rounded bg-white shadow-lg cursor-grabbing">
      <p className="text-xs text-gray-700 break-words">{item.description}</p>
    </div>
  );
}

function App() {
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [goalModalOpen, setGoalModalOpen] = useState(false);
  const [selectedDimension, setSelectedDimension] = useState<Dimension | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const dragStartTimeRef = useRef<number | null>(null);

  // State for inline editing
  const [editingMilestoneId, setEditingMilestoneId] = useState<string | null>(null);
  const [editingMilestoneText, setEditingMilestoneText] = useState<string>('');

  const sensors = useSensors(
    useSensor(PointerSensor, {
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

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
      loadedFrom: 'supabase',
      editingId: editingMilestoneId
    });
  }, [milestones, goals, editingMilestoneId]);

  function findContainer(id: UniqueIdentifier): string | null {
    if (id.toString().startsWith('cell-')) {
      return id.toString();
    }
    const milestone = milestones.find(m => m.id === id);
    if (milestone) {
      return `cell-${milestone.dimension}-${milestone.month}`;
    }
    return null;
  }
  
  function getMilestoneById(id: UniqueIdentifier): Milestone | undefined {
    return milestones.find(m => m.id === id);
  }

  const handleDragStart = (event: DragStartEvent) => {
    console.log("DRAG START:", event.active);
    // If an item is already being edited, cancel edit before starting a new drag
    if (editingMilestoneId) {
      // Potentially save if changes were made, or just cancel
      // For now, just cancel to prevent conflicts with drag
      handleCancelInlineEdit(); 
    }
    setActiveId(event.active.id);
    dragStartTimeRef.current = Date.now();
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over, delta } = event;
    setActiveId(null); 
    const dragEndTime = Date.now();
    const dragDuration = dragStartTimeRef.current ? dragEndTime - dragStartTimeRef.current : Infinity;
    dragStartTimeRef.current = null;

    console.log("DRAG END - Active:", JSON.stringify(active, null, 2), "Over:", JSON.stringify(over, null, 2), "Delta:", delta, "Duration:", dragDuration);

    const activeIdStr = active.id.toString();
    const activeMilestone = getMilestoneById(activeIdStr);

    if (!activeMilestone) {
        console.error('Active milestone (id: '+activeIdStr+') not found for drag end.');
        return;
    }

    const wasDraggedSignificantly = Math.abs(delta.x) >= TAP_DISTANCE_THRESHOLD_PX || Math.abs(delta.y) >= TAP_DISTANCE_THRESHOLD_PX;

    if (!over || active.id === over.id || !wasDraggedSignificantly) {
        if (dragDuration < TAP_THRESHOLD_MS && !wasDraggedSignificantly) {
            console.log('Tap detected on milestone:', activeIdStr);
            handleMilestoneClick(activeMilestone);
            return; 
        } else if (dragDuration >= LONG_PRESS_THRESHOLD_MS && !wasDraggedSignificantly) {
            console.log('Long press detected for edit on milestone:', activeIdStr);
            handleInitiateInlineEdit(activeMilestone);
            return; 
        }
        if(!over || active.id === over.id ){
            console.log('Drag ended on self without criteria for tap/long-press, or no valid drop target (over is null or same as active).');
            return;
        }
    }
    
    if (!over) { 
        console.log('No valid drop target after interaction checks (over is definitively null), drag cancelled.');
        return;
    }
    const overIdStr = over.id.toString();
    console.log(`Initial Check: Active ID: ${activeIdStr}, Over ID: ${overIdStr}`);
    
    const sourceContainerId = active.data.current?.sortable?.containerId?.toString() || findContainer(activeIdStr);
    
    let targetContainerId: string | null = null;
    if (over.data.current?.type === 'cellContainer' && over.id.toString().startsWith('cell-')) {
        targetContainerId = over.id.toString();
        console.log(`Target identified as cell container via over.data.current.type: ${targetContainerId}`);
    } else if (over.id.toString().startsWith('cell-')) { 
      targetContainerId = over.id.toString();
      console.log(`Target identified as cell container via over.id pattern: ${targetContainerId}`);
    } else if (over.data.current?.sortable?.containerId) { 
      targetContainerId = over.data.current.sortable.containerId.toString();
      console.log(`Target identified as item's container via over.data.current.sortable.containerId: ${targetContainerId}`);
    } else {
      targetContainerId = findContainer(over.id);
      console.log(`Target identified via fallback findContainer(over.id): ${targetContainerId}`);
    }

    if (!sourceContainerId || !targetContainerId) {
      console.error('Could not determine source or target container IDs for intentional drag.', { sourceContainerId, targetContainerId, active, over });
      return;
    }
    console.log(`Intentional Drag - Source Container: ${sourceContainerId}, Target Container: ${targetContainerId}`);
    
    const targetContainerIdStr = targetContainerId.toString();
    
    // Robust parsing for cell IDs like "cell-self-realization-6"
    let newDimensionStr: string;
    let newMonthStr: string;

    if (targetContainerIdStr.startsWith('cell-')) {
        const Suffix = targetContainerIdStr.substring(5); // Remove "cell-"
        const lastHyphenIndex = Suffix.lastIndexOf('-');
        if (lastHyphenIndex === -1 || lastHyphenIndex === 0 || lastHyphenIndex === Suffix.length - 1) {
            console.error('Invalid cell ID format for parsing dimension and month:', targetContainerIdStr);
            return;
        }
        newDimensionStr = Suffix.substring(0, lastHyphenIndex);
        newMonthStr = Suffix.substring(lastHyphenIndex + 1);
    } else {
        console.error('Target container ID does not start with \"cell-\":', targetContainerIdStr);
        return; // Should not happen if targetContainerId logic is correct
    }

    const newDimension = newDimensionStr as Dimension;
    const newMonth = parseInt(newMonthStr, 10);

    if (isNaN(newMonth)) {
      console.error('Parsed newMonth is NaN. Original month string from cell ID:', newMonthStr, 'From cell ID:', targetContainerIdStr, 'Dimension parsed:', newDimensionStr);
      return;
    }

    let newMilestones = [...milestones];
    const supabasePayloadsToUpsert: any[] = [];

    if (sourceContainerId === targetContainerId) {
      const itemsInContainer = newMilestones
        .filter(m => findContainer(m.id) === sourceContainerId)
        .sort((a, b) => a.order_index - b.order_index);
      
      const oldItemIndex = itemsInContainer.findIndex(m => m.id === activeIdStr);
      let newItemIndex = itemsInContainer.findIndex(m => m.id === overIdStr);

      if (oldItemIndex === -1) { console.error("Reorder: oldItemIndex not found"); return; }
      if (newItemIndex === -1) { 
        if (overIdStr === targetContainerId) { 
            newItemIndex = itemsInContainer.length -1; // Corrected to be a valid index for arrayMove if last item
            if (oldItemIndex === newItemIndex && itemsInContainer.length > 1) newItemIndex--; // Avoid no-op move to same last spot unless it's the only item
            if (newItemIndex < 0) newItemIndex = 0;
        } else {
            console.error("Reorder: newItemIndex not found and not dropped on container itself."); return;
        }
      }
      
      if (oldItemIndex !== newItemIndex) {
        const reorderedItemsInCurrentContainer = arrayMove(itemsInContainer, oldItemIndex, newItemIndex);
        
        // Update local state and prepare Supabase payloads
        const updatedMilestonesMap = new Map<string, Milestone>();
        reorderedItemsInCurrentContainer.forEach((item, index) => {
          const originalMilestoneFromState = newMilestones.find(m => m.id === item.id);
          if (originalMilestoneFromState) {
            const updatedItem = { ...originalMilestoneFromState, order_index: index };
            updatedMilestonesMap.set(item.id, updatedItem);
            if (originalMilestoneFromState.order_index !== index) {
              supabasePayloadsToUpsert.push({
                id: updatedItem.id,
                user_id: updatedItem.user_id || DEFAULT_USER_ID,
                description: updatedItem.description,
                type: 'monthly', 
                month: updatedItem.month, 
                year: updatedItem.month < 4 ? 2026 : 2025, 
                is_completed: updatedItem.completed,
                order_index: updatedItem.order_index,
                dimension: updatedItem.dimension,
              });
            }
          }
        });

        newMilestones = newMilestones.map(m => {
          if (findContainer(m.id) === sourceContainerId) {
            return updatedMilestonesMap.get(m.id) || m;
          }
          return m;
        });
      }
    } else {
      // --- MOVING TO DIFFERENT CONTAINER ---
      const newYear = newMonth < 4 ? 2026 : 2025;

      const movedItem = { 
        ...activeMilestone, 
        dimension: newDimension, 
        month: newMonth, 
        year: newYear,
        user_id: activeMilestone.user_id || DEFAULT_USER_ID
      };

      const sourceContainerItems = newMilestones
        .filter(m => findContainer(m.id) === sourceContainerId && m.id !== activeIdStr)
        .sort((a, b) => a.order_index - b.order_index);
      sourceContainerItems.forEach((milestone, index) => {
        if (milestone.order_index !== index) {
          milestone.order_index = index;
          supabasePayloadsToUpsert.push({ 
            id: milestone.id, user_id: milestone.user_id || DEFAULT_USER_ID, description: milestone.description,
            type: 'monthly', month: milestone.month, year: milestone.month < 4 ? 2026 : 2025,
            is_completed: milestone.completed, order_index: index, dimension: milestone.dimension,
          });
        }
      });

      let targetContainerItems = newMilestones
        .filter(m => findContainer(m.id) === targetContainerId && m.id !== activeIdStr) 
        .sort((a, b) => a.order_index - b.order_index);
      let insertionIndex = targetContainerItems.length;
      if (overIdStr !== targetContainerId && getMilestoneById(overIdStr) && findContainer(overIdStr) === targetContainerId) { 
        const overItemActualIndex = targetContainerItems.findIndex(m => m.id === overIdStr);
        if (overItemActualIndex !== -1) {
          insertionIndex = overItemActualIndex;
        }
      }
      targetContainerItems.splice(insertionIndex, 0, movedItem);
      targetContainerItems.forEach((milestone, index) => {
        milestone.order_index = index; 
        const fullData = milestone; 
        supabasePayloadsToUpsert.push({
          id: fullData.id, user_id: fullData.user_id || DEFAULT_USER_ID, description: fullData.description,
          type: 'monthly', month: fullData.month, year: fullData.month < 4 ? 2026 : 2025,
          is_completed: fullData.completed, order_index: index, dimension: fullData.dimension,
        });
      });
      newMilestones = newMilestones.filter(m => m.id !== activeIdStr); 
      newMilestones = newMilestones.filter(m => findContainer(m.id) !== sourceContainerId && findContainer(m.id) !== targetContainerId);
      newMilestones.push(...sourceContainerItems, ...targetContainerItems);
    }

    newMilestones.sort((a,b) => {
      if (a.dimension.localeCompare(b.dimension) !== 0) return a.dimension.localeCompare(b.dimension);
      if (a.month !== b.month) return (a.month || 0) - (b.month || 0); // Handle potential null month defensively
      return (a.order_index || 0) - (b.order_index || 0); // Handle potential null order_index
    });
    setMilestones(newMilestones);

    if (supabasePayloadsToUpsert.length > 0) {
      const uniqueSupabaseUpdates = Array.from(new Map(supabasePayloadsToUpsert.map(item => [item.id, item])).values());
      console.log("Supabase Upsert Payload (Intentional Drag):", JSON.stringify(uniqueSupabaseUpdates, null, 2));
      const { error } = await supabase.from('goals').upsert(uniqueSupabaseUpdates);
      if (error) {
        console.error('Supabase batch update error (Intentional Drag):', error);
        alert('Error saving drag changes to the server.');
      }
    } else {
      console.log("No D&D changes to persist to Supabase.");
    }
  };
  
  const handleAddMilestone = async (newMilestoneData: Omit<Milestone, 'id' | 'order_index' | 'user_id'>) => {
    const { data: userResponse } = await supabase.auth.getUser();
    const userId = userResponse?.user?.id || DEFAULT_USER_ID;
    const tempId = `temp-${Date.now()}`;

    const itemsInCell = milestones.filter(m => m.dimension === newMilestoneData.dimension && m.month === newMilestoneData.month);
    const newOrderIndex = itemsInCell.length;

    const milestoneToInsertForUI: Milestone = {
      ...newMilestoneData,
      id: tempId, 
      user_id: userId, // Assign user_id for UI consistency
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

  const handleMilestoneClick = async (milestone: Milestone) => {
    // If we are currently editing this milestone, a click should perhaps save the edit.
    // However, simple tap action is for completion.
    // For now, if it's being edited, a click outside the input field (onBlur) handles save.
    if (editingMilestoneId === milestone.id) {
      // handleSubmitInlineEdit(); // Or, do nothing and let blur handle it.
      return;
    }

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

  const handleMilestoneEditTrigger = (milestone: Milestone) => { // Renamed from handleMilestoneEdit to avoid conflict
    // This is for opening the sidebar to edit, not inline edit
    setSelectedDimension(milestone.dimension);
    setSelectedMonth(milestone.month);
    setSidebarOpen(true);
    // TODO: Populate sidebar with milestone data for editing
  };

  const handleMilestoneDelete = async (milestoneToDelete: Milestone) => {
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
      const affectedContainerId = findContainer(milestoneToDelete.id);
      if(affectedContainerId){
        const itemsToReorder = originalMilestones
          .filter(m => m.id !== milestoneToDelete.id && findContainer(m.id) === affectedContainerId)
          .sort((a,b) => a.order_index - b.order_index)
          .map((item, index) => ({...item, order_index: index}));
        
        setMilestones(prev => {
            let updatedMilestones = prev.filter(m => findContainer(m.id) !== affectedContainerId);
            updatedMilestones.push(...itemsToReorder);
            return updatedMilestones.sort((a,b) => a.dimension.localeCompare(b.dimension) || a.month - b.month || a.order_index - b.order_index);
        });
        
        const orderUpdates = itemsToReorder.map(m => ({id: m.id, order_index: m.order_index, user_id: m.user_id || DEFAULT_USER_ID, description: m.description, type: 'monthly', month: m.month, year: m.month < 4 ? 2026: 2025, is_completed: m.completed, dimension: m.dimension }));
        if(orderUpdates.length > 0) {
          supabase.from('goals').upsert(orderUpdates).then(({error: orderErr}) => {
            if(orderErr) console.error('Supabase order update error post-delete:', orderErr);
          });
        }
      }
    } catch (e) {
      console.error('Supabase call failed for delete:', e);
      setMilestones(originalMilestones); 
      alert('An unexpected error occurred while deleting. Please try again.');
    }
  };

  const handleAddNewMilestone = (dimension: Dimension, month: number) => {
    setSelectedDimension(dimension);
    setSelectedMonth(month);
    setSidebarOpen(true);
  };

  const handleGoalToggle = async (goal: Goal) => {
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

  const handleGoalAdd = (dimension: Dimension) => {
    setSelectedDimension(dimension);
    setGoalModalOpen(true);
  };

  const handleGoalSubmit = async (description: string) => {
    if (selectedDimension) {
      const { data: userResponse } = await supabase.auth.getUser();
      const userId = userResponse?.user?.id || DEFAULT_USER_ID;
      const tempId = `temp-goal-${Date.now()}`;

      const goalToInsertForUI: Goal = {
        id: tempId,
        user_id: userId,
        dimension: selectedDimension,
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
            dimension: selectedDimension,
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
    }
  };

  const handleGoalDelete = async (goalToDelete: Goal) => {
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

  const calculateProgress = () => {
    if (!milestones || !Array.isArray(milestones) || milestones.length === 0) {
      return 0;
    }
    const completedMilestones = milestones.filter(m => m.completed).length;
    return Math.round((completedMilestones / milestones.length) * 100);
  };

  const activeItemForOverlay = activeId ? milestones.find(m => m.id === activeId) : null;

  // --- Inline Edit Handlers ---
  const handleInitiateInlineEdit = (milestoneToEdit: Milestone) => {
    console.log('Initiating inline edit for:', milestoneToEdit.id);
    setEditingMilestoneId(milestoneToEdit.id);
    setEditingMilestoneText(milestoneToEdit.description);
  };

  const handleEditingMilestoneTextChange = (text: string) => {
    setEditingMilestoneText(text);
  };

  const handleCancelInlineEdit = () => {
    console.log('Cancelling inline edit');
    setEditingMilestoneId(null);
    setEditingMilestoneText('');
  };

  const handleSubmitInlineEdit = async () => {
    if (!editingMilestoneId) return;
    console.log('Submitting inline edit for:', editingMilestoneId, 'New text:', editingMilestoneText);

    const originalMilestone = milestones.find(m => m.id === editingMilestoneId);
    if (!originalMilestone) {
      console.error('Cannot submit edit, original milestone not found');
      handleCancelInlineEdit();
      return;
    }

    // Check if text actually changed
    if (originalMilestone.description === editingMilestoneText.trim()) {
      console.log('No change in text, cancelling edit mode.');
      handleCancelInlineEdit();
      return;
    }

    const updatedMilestone = { ...originalMilestone, description: editingMilestoneText.trim() };

    // Optimistic UI Update
    setMilestones(prev => prev.map(m => m.id === editingMilestoneId ? updatedMilestone : m));
    const previousEditingId = editingMilestoneId;
    handleCancelInlineEdit(); // Clear editing state immediately

    try {
      const { error } = await supabase
        .from('goals')
        .update({ description: updatedMilestone.description })
        .eq('id', previousEditingId);
      if (error) {
        console.error('Error updating milestone description in Supabase:', error);
        // Revert UI change on error
        setMilestones(prev => prev.map(m => m.id === previousEditingId ? originalMilestone : m));
        alert('Failed to save milestone changes.');
      }
    } catch (e) {
      console.error('Supabase call failed for description update:', e);
      setMilestones(prev => prev.map(m => m.id === previousEditingId ? originalMilestone : m));
      alert('An unexpected error occurred while saving changes.');
    }
  };
  // --- End Inline Edit Handlers ---

  return (
    <DndContext 
      sensors={sensors} 
      collisionDetection={closestCenter} 
      onDragStart={handleDragStart}
      onDragOver={handleDragOver} 
      onDragEnd={handleDragEnd}
    >
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="w-full mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Target className="w-8 h-8 text-blue-600 mr-2" />
              <h1 className="text-2xl font-bold text-gray-900">Life Dimensions</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="bg-blue-50 px-4 py-2 rounded-lg">
                <span className="text-blue-700 font-medium">
                  Overall Progress: {calculateProgress()}%
                </span>
              </div>
              </div>
          </div>
        </div>
      </header>

      <main className="w-full mx-auto px-1 py-2 overflow-x-auto">
        <div className="bg-white rounded-lg shadow-sm p-1">
          <Grid 
            milestones={milestones} 
            goals={goals}
            onMilestoneClick={handleMilestoneClick}
            onTriggerInlineEdit={handleInitiateInlineEdit}
            onMilestoneDelete={handleMilestoneDelete}
            onAddMilestone={handleAddNewMilestone}
            onGoalToggle={handleGoalToggle}
            onGoalAdd={handleGoalAdd}
            onGoalDelete={handleGoalDelete}
            editingMilestoneId={editingMilestoneId}
            editingMilestoneText={editingMilestoneText}
            onEditingMilestoneTextChange={handleEditingMilestoneTextChange}
            onSubmitInlineEdit={handleSubmitInlineEdit}
            onCancelInlineEdit={handleCancelInlineEdit}
          />
        </div>
      </main>

      <button
        onClick={() => {
          setSelectedDimension(null);
          setSelectedMonth(null);
          setSidebarOpen(true);
        }}
        className="fixed bottom-4 right-4 bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 transition-colors duration-200"
      >
        <Plus className="w-6 h-6" />
      </button>

      <Sidebar
        onAddMilestone={handleAddMilestone}
        onMilestoneDelete={handleMilestoneDelete}
        dimension={selectedDimension}
        month={selectedMonth}
        milestones={milestones}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <GoalModal
        dimension={selectedDimension || 'family'}
        isOpen={goalModalOpen}
        onClose={() => setGoalModalOpen(false)}
        onSubmit={handleGoalSubmit}
      />
    </div>
      <DragOverlay>
        {activeItemForOverlay ? <MilestoneOverlayItem item={activeItemForOverlay} /> : null}
      </DragOverlay>
    </DndContext>
  );
}

export default App;