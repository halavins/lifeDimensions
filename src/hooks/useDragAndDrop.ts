import { useState, useRef } from 'react';
import { arrayMove } from '@dnd-kit/sortable';
import { supabase } from '../supabaseClient';
import type { Milestone } from '../types';
import type { DragEndEvent, DragStartEvent, DragOverEvent, UniqueIdentifier } from '@dnd-kit/core';

const DEFAULT_USER_ID = 'c0bb2a63-eb05-483b-8b9b-ddb70682b8d3';
const TAP_THRESHOLD_MS = 250;
const TAP_DISTANCE_THRESHOLD_PX = 10;
const LONG_PRESS_THRESHOLD_MS = 500;

export function useDragAndDrop(
  milestones: Milestone[],
  setMilestones: React.Dispatch<React.SetStateAction<Milestone[]>>,
  onMilestoneClick: (milestone: Milestone) => void,
  onInitiateInlineEdit: (milestone: Milestone) => void,
  editingMilestoneId: string | null,
  handleCancelInlineEdit: () => void
) {
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);
  const dragStartTimeRef = useRef<number | null>(null);

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
            onMilestoneClick(activeMilestone);
            return; 
        } else if (dragDuration >= LONG_PRESS_THRESHOLD_MS && !wasDraggedSignificantly) {
            console.log('Long press detected for edit on milestone:', activeIdStr);
            onInitiateInlineEdit(activeMilestone);
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

    // Handle the complex drag logic here...
    await processDragEnd(active, over, activeMilestone);
  };

  const processDragEnd = async (active: any, over: any, activeMilestone: Milestone) => {
    const activeIdStr = active.id.toString();
    const overIdStr = over.id.toString();
    
    const sourceContainerId = active.data.current?.sortable?.containerId?.toString() || findContainer(activeIdStr);
    
    let targetContainerId: string | null = null;
    if (over.data.current?.type === 'cellContainer' && over.id.toString().startsWith('cell-')) {
        targetContainerId = over.id.toString();
    } else if (over.id.toString().startsWith('cell-')) { 
      targetContainerId = over.id.toString();
    } else if (over.data.current?.sortable?.containerId) { 
      targetContainerId = over.data.current.sortable.containerId.toString();
    } else {
      targetContainerId = findContainer(over.id);
    }

    if (!sourceContainerId || !targetContainerId) {
      console.error('Could not determine source or target container IDs for intentional drag.', { sourceContainerId, targetContainerId, active, over });
      return;
    }

    const targetContainerIdStr = targetContainerId.toString();
    
    // Parse dimension and month from cell ID
    let newDimensionStr: string;
    let newMonthStr: string;

    if (targetContainerIdStr.startsWith('cell-')) {
        const Suffix = targetContainerIdStr.substring(5);
        const lastHyphenIndex = Suffix.lastIndexOf('-');
        if (lastHyphenIndex === -1 || lastHyphenIndex === 0 || lastHyphenIndex === Suffix.length - 1) {
            console.error('Invalid cell ID format for parsing dimension and month:', targetContainerIdStr);
            return;
        }
        newDimensionStr = Suffix.substring(0, lastHyphenIndex);
        newMonthStr = Suffix.substring(lastHyphenIndex + 1);
    } else {
        console.error('Target container ID does not start with "cell-":', targetContainerIdStr);
        return;
    }

    const newDimension = newDimensionStr as any;
    const newMonth = parseInt(newMonthStr, 10);

    if (isNaN(newMonth)) {
      console.error('Parsed newMonth is NaN. Original month string from cell ID:', newMonthStr);
      return;
    }

    let newMilestones = [...milestones];
    const supabasePayloadsToUpsert: any[] = [];

    if (sourceContainerId === targetContainerId) {
      // Handle reordering within same container
      const itemsInContainer = newMilestones
        .filter(m => findContainer(m.id) === sourceContainerId)
        .sort((a, b) => a.order_index - b.order_index);
      
      const oldItemIndex = itemsInContainer.findIndex(m => m.id === activeIdStr);
      let newItemIndex = itemsInContainer.findIndex(m => m.id === overIdStr);

      if (oldItemIndex === -1) { 
        console.error("Reorder: oldItemIndex not found"); 
        return; 
      }
      
      if (newItemIndex === -1) { 
        if (overIdStr === targetContainerId) { 
            newItemIndex = itemsInContainer.length - 1;
            if (oldItemIndex === newItemIndex && itemsInContainer.length > 1) newItemIndex--;
            if (newItemIndex < 0) newItemIndex = 0;
        } else {
            console.error("Reorder: newItemIndex not found and not dropped on container itself."); 
            return;
        }
      }
      
      if (oldItemIndex !== newItemIndex) {
        const reorderedItemsInCurrentContainer = arrayMove(itemsInContainer, oldItemIndex, newItemIndex);
        
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
      // Handle moving to different container
      const newYear = newMonth < 4 ? 2026 : 2025;
      const movedItem = { 
        ...activeMilestone, 
        dimension: newDimension, 
        month: newMonth, 
        year: newYear,
        user_id: activeMilestone.user_id || DEFAULT_USER_ID
      };

      // Update source container items
      const sourceContainerItems = newMilestones
        .filter(m => findContainer(m.id) === sourceContainerId && m.id !== activeIdStr)
        .sort((a, b) => a.order_index - b.order_index);
      sourceContainerItems.forEach((milestone, index) => {
        if (milestone.order_index !== index) {
          milestone.order_index = index;
          supabasePayloadsToUpsert.push({ 
            id: milestone.id, 
            user_id: milestone.user_id || DEFAULT_USER_ID, 
            description: milestone.description,
            type: 'monthly', 
            month: milestone.month, 
            year: milestone.month < 4 ? 2026 : 2025,
            is_completed: milestone.completed, 
            order_index: index, 
            dimension: milestone.dimension,
          });
        }
      });

      // Update target container items
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
        supabasePayloadsToUpsert.push({
          id: milestone.id, 
          user_id: milestone.user_id || DEFAULT_USER_ID, 
          description: milestone.description,
          type: 'monthly', 
          month: milestone.month, 
          year: milestone.month < 4 ? 2026 : 2025,
          is_completed: milestone.completed, 
          order_index: index, 
          dimension: milestone.dimension,
        });
      });
      
      newMilestones = newMilestones.filter(m => m.id !== activeIdStr); 
      newMilestones = newMilestones.filter(m => findContainer(m.id) !== sourceContainerId && findContainer(m.id) !== targetContainerId);
      newMilestones.push(...sourceContainerItems, ...targetContainerItems);
    }

    newMilestones.sort((a,b) => {
      if (a.dimension.localeCompare(b.dimension) !== 0) return a.dimension.localeCompare(b.dimension);
      if (a.month !== b.month) return (a.month || 0) - (b.month || 0);
      return (a.order_index || 0) - (b.order_index || 0);
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
    }
  };

  return {
    activeId,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
  };
}