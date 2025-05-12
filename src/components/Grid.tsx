import React, { useState } from 'react';
import { CheckCircle2, Circle, Pencil, Trash2, Plus, X, Check, Edit } from 'lucide-react';
import type { Milestone, Dimension, Goal } from '../types';
import { useSortable, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useDroppable } from '@dnd-kit/core';

// Helper component for individual sortable milestones
interface SortableMilestoneItemProps {
  milestone: Milestone;
  onContextMenu: (event: React.MouseEvent, milestone: Milestone) => void;
  isEditing: boolean;
  editingText: string;
  onEditTextChange: (text: string) => void;
  onSubmitEdit: () => void;
  onCancelEdit: () => void;
}

function SortableMilestoneItem({ 
  milestone, 
  onContextMenu, 
  isEditing, 
  editingText, 
  onEditTextChange, 
  onSubmitEdit, 
  onCancelEdit 
}: SortableMilestoneItemProps) {
  const {
    attributes,
    listeners, // These are the drag handles
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id: milestone.id,
    data: { type: 'milestone', item: milestone },
    disabled: isEditing, // Disable dragging while editing
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 100 : 'auto',
  };

  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  React.useEffect(() => {
    if (isEditing && textareaRef.current) {
      // Auto-focus
      textareaRef.current.focus();
      // Adjust height to content
      textareaRef.current.style.height = 'auto'; // Reset height
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
      // Move cursor to end
      textareaRef.current.selectionStart = textareaRef.current.selectionEnd = textareaRef.current.value.length;
    }
  }, [isEditing]);

  const handleTextChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    onEditTextChange(event.target.value);
    // Auto-adjust height on change
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) { // Submit on Enter (but not Shift+Enter for newline)
      event.preventDefault(); // Prevent newline in textarea
      onSubmitEdit();
    } else if (event.key === 'Escape') {
      onCancelEdit();
    }
  };

  if (isEditing) {
    return (
      // When editing, remove padding from this outer div if the textarea handles its own padding to match the <p>
      <div ref={setNodeRef} style={style} {...attributes} className="w-full">
        <textarea 
          ref={textareaRef}
          value={editingText}
          onChange={handleTextChange}
          onBlur={() => {
            // Delay blur submission slightly to allow click on potential save button if added later
            // For now, direct submit is fine.
            onSubmitEdit();
          }} 
          onKeyDown={handleKeyDown}
          className="text-xs text-gray-700 break-words w-full border border-blue-500 rounded px-1 py-0.5 resize-none overflow-hidden box-border focus:outline-none focus:ring-1 focus:ring-blue-500"
          rows={1} // Start with one row, will auto-grow
        />
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes} 
      className="group w-full p-0.5 sm:p-1 rounded hover:bg-white/70 transition-colors cursor-grab touch-manipulation"
    >
      <div 
        {...listeners} // Makes this div the drag handle
        onContextMenu={(e) => onContextMenu(e, milestone)} 
      >
        <p
          className={`text-xs text-gray-700 break-words w-full px-1 py-0.5 ${milestone.completed ? 'line-through text-gray-500' : ''}`}
        >
          {milestone.description}
        </p>
      </div>
    </div>
  );
}

// Action menu component for milestones
interface ActionMenuProps {
  milestone: Milestone;
  position: { x: number; y: number };
  onClose: () => void;
  onComplete: () => void;
  onTriggerInlineEdit: (milestone: Milestone) => void;
  onDelete: () => void;
}

function ActionMenu({ milestone, position, onClose, onComplete, onTriggerInlineEdit, onDelete }: ActionMenuProps) {
  return (
    <div 
      className="fixed z-50 bg-white rounded-lg shadow-xl py-1 min-w-[150px]"
      style={{ 
        top: `${position.y}px`, 
        left: `${position.x}px`
      }}
    >
      <div className="px-3 py-2 border-b text-sm font-medium">Milestone Actions</div>
      <button 
        className="w-full px-3 py-2 text-left hover:bg-gray-100 flex items-center text-sm"
        onClick={() => { onComplete(); onClose(); }}
      >
        <Check className="w-4 h-4 mr-2" /> 
        {milestone.completed ? 'Mark as Incomplete' : 'Mark as Complete'}
      </button>
      <button 
        className="w-full px-3 py-2 text-left hover:bg-gray-100 flex items-center text-sm"
        onClick={() => { onTriggerInlineEdit(milestone); onClose(); }}
      >
        <Edit className="w-4 h-4 mr-2" /> Edit (Inline)
      </button>
      <button 
        className="w-full px-3 py-2 text-left hover:bg-gray-100 flex items-center text-sm text-red-500"
        onClick={() => { onDelete(); onClose(); }}
      >
        <Trash2 className="w-4 h-4 mr-2" /> Delete
      </button>
    </div>
  );
}

// Goal action menu component
interface GoalActionMenuProps {
  goal: Goal;
  position: { x: number; y: number };
  onClose: () => void;
  onComplete: () => void;
  onDelete: () => void;
}

function GoalActionMenu({ goal, position, onClose, onComplete, onDelete }: GoalActionMenuProps) {
  return (
    <div 
      className="fixed z-50 bg-white rounded-lg shadow-xl py-1 min-w-[150px]"
      style={{ 
        top: `${position.y}px`, 
        left: `${position.x}px`
      }}
    >
      <div className="px-3 py-2 border-b text-sm font-medium">Goal Actions</div>
      <button 
        className="w-full px-3 py-2 text-left hover:bg-gray-100 flex items-center text-sm"
        onClick={() => { onComplete(); onClose(); }}
      >
        <Check className="w-4 h-4 mr-2" /> 
        {goal.completed ? 'Mark as Incomplete' : 'Mark as Complete'}
      </button>
      <button 
        className="w-full px-3 py-2 text-left hover:bg-gray-100 flex items-center text-sm text-red-500"
        onClick={() => { onDelete(); onClose(); }}
      >
        <Trash2 className="w-4 h-4 mr-2" /> Delete
      </button>
    </div>
  );
}

interface GridProps {
  milestones: Milestone[];
  goals: Goal[];
  onMilestoneClick: (milestone: Milestone) => void;
  onTriggerInlineEdit: (milestone: Milestone) => void;
  onMilestoneDelete: (milestone: Milestone) => void;
  onAddMilestone: (dimension: Dimension, month: number) => void;
  onGoalToggle: (goal: Goal) => void;
  onGoalAdd: (dimension: Dimension) => void;
  onGoalDelete: (goal: Goal) => void;
  editingMilestoneId: string | null;
  editingMilestoneText: string;
  onEditingMilestoneTextChange: (text: string) => void;
  onSubmitInlineEdit: () => void;
  onCancelInlineEdit: () => void;
}

const dimensions: Dimension[] = ['family', 'health', 'wealth', 'self-realization', 'friends', 'leisure'];

// Define months in the order they appear in the CSV (Apr-Mar)
const monthsInOrder = [
  { number: 4, name: 'Apr' },
  { number: 5, name: 'May' },
  { number: 6, name: 'Jun' },
  { number: 7, name: 'Jul' },
  { number: 8, name: 'Aug' },
  { number: 9, name: 'Sep' },
  { number: 10, name: 'Oct' },
  { number: 11, name: 'Nov' },
  { number: 12, name: 'Dec' },
  { number: 1, name: 'Jan' },
  { number: 2, name: 'Feb' },
  { number: 3, name: 'Mar' }
];

const dimensionColors: Record<Dimension, string> = {
  family: 'bg-pink-100 hover:bg-pink-200',
  health: 'bg-green-100 hover:bg-green-200',
  wealth: 'bg-purple-100 hover:bg-purple-200',
  'self-realization': 'bg-blue-100 hover:bg-blue-200',
  friends: 'bg-yellow-100 hover:bg-yellow-200',
  leisure: 'bg-orange-100 hover:bg-orange-200',
};

// Component for a single cell, which can be a drop target
interface CellProps {
  id: string;
  dimension: Dimension;
  month: number;
  milestonesInCell: Milestone[];
  isHovered: boolean;
  activeMenu: any; // Simplified type for brevity
  onAddMilestone: (dimension: Dimension, month: number) => void;
  handleMilestoneContextMenu: (event: React.MouseEvent, milestone: Milestone) => void;
  editingMilestoneId: string | null;
  editingMilestoneText: string;
  onEditingMilestoneTextChange: (text: string) => void;
  onSubmitInlineEdit: () => void;
  onCancelInlineEdit: () => void;
}

function Cell({ 
  id, dimension, month, milestonesInCell, isHovered, activeMenu, onAddMilestone, handleMilestoneContextMenu, 
  editingMilestoneId, editingMilestoneText, onEditingMilestoneTextChange, onSubmitInlineEdit, onCancelInlineEdit 
}: CellProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: id, 
    data: { type: 'cellContainer', dimension, month } 
  });

  return (
    <div
      ref={setNodeRef} 
      className={`${ 
        dimensionColors[dimension] // Always use the dimension color
      } ${isOver ? 'outline-2 outline-blue-500 outline-dashed' : ''} p-1 sm:p-1.5 rounded-lg transition-colors duration-200 min-h-[80px] relative flex flex-col justify-start items-stretch`}
    >
      {/* SortableContext is still used for items *within* the cell when they exist */}
      <SortableContext items={milestonesInCell.map(m => m.id)} strategy={verticalListSortingStrategy} id={id}>
        {milestonesInCell.length > 0 ? (
          <div className="space-y-1.5 w-full">
            {milestonesInCell.map(milestone => (
              <SortableMilestoneItem 
                key={milestone.id} 
                milestone={milestone} 
                onContextMenu={handleMilestoneContextMenu}
                isEditing={editingMilestoneId === milestone.id}
                editingText={editingMilestoneId === milestone.id ? editingMilestoneText : milestone.description}
                onEditTextChange={onEditingMilestoneTextChange}
                onSubmitEdit={onSubmitInlineEdit}
                onCancelEdit={onCancelInlineEdit}
              />
            ))}
          </div>
        ) : (
          <div className="flex-grow w-full flex items-center justify-center"> 
            {isHovered && !activeMenu && (
              <button
                onClick={() => onAddMilestone(dimension, month)}
                className="p-2 rounded-full hover:bg-gray-200 transition-colors"
              >
                <Plus className="w-5 h-5 text-gray-400" />
              </button>
            )}
            {!isHovered && <div className="min-h-[60px] w-full"></div>} 
          </div>
        )}
      </SortableContext>
    </div>
  );
}

export function Grid({ 
  milestones, 
  goals, 
  onMilestoneClick, 
  onTriggerInlineEdit,
  onMilestoneDelete,
  onAddMilestone,
  onGoalToggle,
  onGoalAdd,
  onGoalDelete,
  editingMilestoneId,
  editingMilestoneText,
  onEditingMilestoneTextChange,
  onSubmitInlineEdit,
  onCancelInlineEdit
}: GridProps) {
  const [hoveredCell, setHoveredCell] = useState<{ dimension: Dimension; month: number } | null>(null);
  const [activeMenu, setActiveMenu] = useState<{
    type: 'milestone' | 'goal';
    item: Milestone | Goal;
    position: { x: number; y: number };
  } | null>(null);

  // Handle click outside of menu to close it
  React.useEffect(() => {
    const handleClickOutside = () => setActiveMenu(null);
    
    if (activeMenu) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [activeMenu]);

  const getMilestones = (dimension: Dimension, month: number) => {
    // Ensure milestones are sorted by their order_index for SortableContext
    return milestones
      .filter(m => m.dimension === dimension && m.month === month)
      .sort((a, b) => (a.order_index || 0) - (b.order_index || 0));
  };

  const getDimensionGoals = (dimension: Dimension) => {
    return goals.filter(g => g.dimension === dimension);
  };

  const handleMilestoneContextMenu = (e: React.MouseEvent, milestone: Milestone) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Calculate position - handle both mobile and desktop
    // On mobile, position the menu above the tapped area to avoid it being cut off
    const isMobile = window.innerWidth < 768;
    const x = isMobile ? Math.min(e.clientX, window.innerWidth - 160) : e.clientX;
    const y = isMobile ? e.clientY - 160 : e.clientY;
    
    setActiveMenu({
      type: 'milestone',
      item: milestone,
      position: { x, y }
    });
  };

  const handleGoalContextMenu = (e: React.MouseEvent, goal: Goal) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Calculate position - handle both mobile and desktop
    // On mobile, position the menu above the tapped area to avoid it being cut off
    const isMobile = window.innerWidth < 768;
    const x = isMobile ? Math.min(e.clientX, window.innerWidth - 160) : e.clientX;
    const y = isMobile ? e.clientY - 160 : e.clientY;
    
    setActiveMenu({
      type: 'goal',
      item: goal,
      position: { x, y }
    });
  };

  return (
    <div className="w-full overflow-x-auto" onClick={(e) => { if (e.target === e.currentTarget) setActiveMenu(null);}}>
      <div className="w-full min-w-[1800px]">
        <div className="grid grid-cols-[50px_repeat(12,minmax(120px,1fr))_minmax(250px,1fr)] gap-0.5 sm:gap-0.5 mb-2">
          <div className="font-semibold text-gray-500 grid-dimension-fixed">Dim.</div>
          {monthsInOrder.map(month => (
            <div key={month.number} className="text-center font-medium text-gray-600">
              {month.name}
            </div>
          ))}
          <div className="text-center font-semibold text-gray-500">Goals</div>
        </div>
        
        {dimensions.map(dimension => (
          <div key={dimension} className="grid grid-cols-[50px_repeat(12,minmax(120px,1fr))_minmax(250px,1fr)] gap-0.5 sm:gap-0.5 mb-0.5 sm:mb-0.5">
            <div className="font-medium text-gray-700 capitalize grid-dimension-fixed vertical-text min-h-[80px]">{dimension}</div>
            {monthsInOrder.map(month => {
              const cellMilestones = getMilestones(dimension, month.number);
              const cellId = `cell-${dimension}-${month.number}`; // Unique ID for each cell/SortableContext
              const isCellHovered = hoveredCell?.dimension === dimension && hoveredCell?.month === month.number;

              return (
                <Cell
                  key={cellId} 
                  id={cellId}
                  dimension={dimension}
                  month={month.number}
                  milestonesInCell={cellMilestones}
                  isHovered={isCellHovered}
                  activeMenu={activeMenu}
                  onAddMilestone={onAddMilestone}
                  handleMilestoneContextMenu={handleMilestoneContextMenu}
                  editingMilestoneId={editingMilestoneId}
                  editingMilestoneText={editingMilestoneText}
                  onEditingMilestoneTextChange={onEditingMilestoneTextChange}
                  onSubmitInlineEdit={onSubmitInlineEdit}
                  onCancelInlineEdit={onCancelInlineEdit}
                />
              );
            })}

            {/* Goals Column */}
            <div className="bg-gray-50 p-1 sm:p-1.5 rounded-lg hover:shadow-md transition-shadow duration-200">
              <div className="flex flex-wrap gap-1 sm:gap-1.5">
                {getDimensionGoals(dimension).map(goal => (
                  <div 
                    key={goal.id} 
                    className="p-0.5 sm:p-1 rounded hover:bg-gray-100 transition-colors cursor-pointer flex-1 min-w-[200px]"
                    onClick={(e) => handleGoalContextMenu(e, goal)}
                    onContextMenu={(e) => handleGoalContextMenu(e, goal)}
                  >
                    <p 
                      className={`text-xs text-gray-700 break-words ${
                        goal.completed ? 'line-through text-gray-500' : ''
                      }`}
                    >
                      {goal.description}
                    </p>
                  </div>
                ))}
                
                {getDimensionGoals(dimension).length < 3 && (
                  <button
                    onClick={() => onGoalAdd(dimension)}
                    className="flex items-center justify-center p-0.5 sm:p-1 text-xs text-gray-500 hover:bg-gray-100 rounded flex-1 min-w-[200px]"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add Goal
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Context Menu for Milestones */}
      {activeMenu && activeMenu.type === 'milestone' && (
        <ActionMenu 
          milestone={activeMenu.item as Milestone}
          position={activeMenu.position}
          onClose={() => setActiveMenu(null)}
          onComplete={() => onMilestoneClick(activeMenu.item as Milestone)}
          onTriggerInlineEdit={() => onTriggerInlineEdit(activeMenu.item as Milestone)}
          onDelete={() => onMilestoneDelete(activeMenu.item as Milestone)}
        />
      )}
      
      {/* Context Menu for Goals */}
      {activeMenu && activeMenu.type === 'goal' && (
        <GoalActionMenu
          goal={activeMenu.item as Goal}
          position={activeMenu.position}
          onClose={() => setActiveMenu(null)}
          onComplete={() => onGoalToggle(activeMenu.item as Goal)}
          onDelete={() => onGoalDelete(activeMenu.item as Goal)}
        />
      )}
    </div>
  );
}