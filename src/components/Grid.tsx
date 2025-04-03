import React, { useState } from 'react';
import { CheckCircle2, Circle, Pencil, Trash2, Plus, X, Check, Edit } from 'lucide-react';
import type { Milestone, Dimension, Goal } from '../types';

// Action menu component for milestones
interface ActionMenuProps {
  milestone: Milestone;
  position: { x: number; y: number };
  onClose: () => void;
  onComplete: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

function ActionMenu({ milestone, position, onClose, onComplete, onEdit, onDelete }: ActionMenuProps) {
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
        onClick={() => { onEdit(); onClose(); }}
      >
        <Edit className="w-4 h-4 mr-2" /> Edit
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
  onMilestoneEdit: (milestone: Milestone) => void;
  onMilestoneDelete: (milestone: Milestone) => void;
  onAddMilestone: (dimension: Dimension, month: number) => void;
  onGoalToggle: (goal: Goal) => void;
  onGoalAdd: (dimension: Dimension) => void;
  onGoalDelete: (goal: Goal) => void;
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

export function Grid({ 
  milestones, 
  goals, 
  onMilestoneClick, 
  onMilestoneEdit, 
  onMilestoneDelete,
  onAddMilestone,
  onGoalToggle,
  onGoalAdd,
  onGoalDelete
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
    return milestones.filter(m => m.dimension === dimension && m.month === month);
  };

  const getDimensionGoals = (dimension: Dimension) => {
    return goals.filter(g => g.dimension === dimension);
  };

  const handleMilestoneContextMenu = (e: React.MouseEvent, milestone: Milestone) => {
    e.preventDefault();
    e.stopPropagation();
    
    setActiveMenu({
      type: 'milestone',
      item: milestone,
      position: { x: e.clientX, y: e.clientY }
    });
  };

  const handleGoalContextMenu = (e: React.MouseEvent, goal: Goal) => {
    e.preventDefault();
    e.stopPropagation();
    
    setActiveMenu({
      type: 'goal',
      item: goal,
      position: { x: e.clientX, y: e.clientY }
    });
  };

  return (
    <div className="w-full overflow-x-auto" onClick={() => setActiveMenu(null)}>
      <div className="w-full min-w-[800px]">
        <div className="grid grid-cols-[120px_repeat(12,minmax(50px,1fr))_180px] gap-1 mb-4">
          <div className="font-semibold text-gray-500">Dimensions</div>
          {monthsInOrder.map(month => (
            <div key={month.number} className="text-center font-medium text-gray-600">
              {month.name}
            </div>
          ))}
          <div className="text-center font-semibold text-gray-500">Goals</div>
        </div>
        
        {dimensions.map(dimension => (
          <div key={dimension} className="grid grid-cols-[120px_repeat(12,minmax(50px,1fr))_180px] gap-1 mb-1">
            <div className="font-medium text-gray-700 capitalize">{dimension}</div>
            {monthsInOrder.map(month => {
              const cellMilestones = getMilestones(dimension, month.number);
              const isHovered = hoveredCell?.dimension === dimension && hoveredCell?.month === month.number;

              return (
                <div
                  key={month.number}
                  className={`${
                    cellMilestones.length > 0 ? dimensionColors[dimension] : 'bg-gray-50'
                  } p-3 rounded-lg transition-colors duration-200 min-h-[80px] relative hover:shadow-md`}
                  onMouseEnter={() => setHoveredCell({ dimension, month: month.number })}
                  onMouseLeave={() => setHoveredCell(null)}
                >
                  {cellMilestones.length > 0 ? (
                    <div className="space-y-3 w-full">
                      {cellMilestones.map(milestone => (
                        <div 
                          key={milestone.id}
                          className="group w-full p-2 rounded hover:bg-white/70 transition-colors cursor-pointer"
                          onClick={(e) => handleMilestoneContextMenu(e, milestone)}
                          onContextMenu={(e) => handleMilestoneContextMenu(e, milestone)}
                        >
                          <p 
                            className={`text-xs text-gray-700 break-words ${
                              milestone.completed ? 'line-through text-gray-500' : ''
                            }`}
                          >
                            {milestone.description}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    isHovered && (
                      <button
                        onClick={() => onAddMilestone(dimension, month.number)}
                        className="absolute inset-0 flex items-center justify-center hover:bg-gray-100 rounded-lg"
                      >
                        <Plus className="w-5 h-5 text-gray-400" />
                      </button>
                    )
                  )}
                </div>
              );
            })}

            {/* Goals Column */}
            <div className="bg-gray-50 p-3 rounded-lg hover:shadow-md transition-shadow duration-200">
              <div className="flex flex-col gap-3">
                {getDimensionGoals(dimension).map(goal => (
                  <div 
                    key={goal.id} 
                    className="p-2 rounded hover:bg-gray-100 transition-colors cursor-pointer"
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
                    className="flex items-center justify-center p-2 text-xs text-gray-500 hover:bg-gray-100 rounded"
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
          onEdit={() => onMilestoneEdit(activeMenu.item as Milestone)}
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