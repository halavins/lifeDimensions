import React, { useState } from 'react';
import { Grid } from './components/Grid';
import { Sidebar } from './components/Sidebar';
import { GoalModal } from './components/GoalModal';
import { MilestoneOverlayItem } from './components/MilestoneOverlayItem';
import { Target, Plus } from 'lucide-react';
import type { Dimension } from './types';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { useMilestones } from './hooks/useMilestones';
import { useGoals } from './hooks/useGoals';
import { useDragAndDrop } from './hooks/useDragAndDrop';
import { useInlineEdit } from './hooks/useInlineEdit';

function App() {
  const {
    milestones,
    goals,
    setMilestones,
    setGoals,
    addMilestone,
    toggleMilestoneCompletion,
    deleteMilestone,
    updateMilestoneDescription,
  } = useMilestones();

  const { toggleGoalCompletion, addGoal, deleteGoal } = useGoals(goals, setGoals);

  const {
    editingMilestoneId,
    editingMilestoneText,
    initiateInlineEdit,
    updateEditingText,
    cancelInlineEdit,
    submitInlineEdit,
  } = useInlineEdit();

  const handleInitiateInlineEdit = (milestone: any) => {
    initiateInlineEdit(milestone.id, milestone.description);
  };

  const handleSubmitInlineEdit = () => {
    submitInlineEdit(updateMilestoneDescription);
  };

  const { activeId, handleDragStart, handleDragOver, handleDragEnd } = useDragAndDrop(
    milestones,
    setMilestones,
    toggleMilestoneCompletion,
    handleInitiateInlineEdit,
    editingMilestoneId,
    cancelInlineEdit
  );

  // UI state
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [goalModalOpen, setGoalModalOpen] = useState(false);
  const [selectedDimension, setSelectedDimension] = useState<Dimension | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleGoalAdd = (dimension: Dimension) => {
    setSelectedDimension(dimension);
    setGoalModalOpen(true);
  };

  const handleGoalSubmit = async (description: string) => {
    if (selectedDimension) {
      await addGoal(selectedDimension, description);
    }
  };

  const handleAddNewMilestone = (dimension: Dimension, month: number) => {
    setSelectedDimension(dimension);
    setSelectedMonth(month);
    setSidebarOpen(true);
  };

  const calculateProgress = () => {
    if (!milestones || !Array.isArray(milestones) || milestones.length === 0) {
      return 0;
    }
    const completedMilestones = milestones.filter(m => m.completed).length;
    return Math.round((completedMilestones / milestones.length) * 100);
  };

  const activeItemForOverlay = activeId ? milestones.find(m => m.id === activeId) : null;

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
              onMilestoneClick={toggleMilestoneCompletion}
              onTriggerInlineEdit={handleInitiateInlineEdit}
              onMilestoneDelete={deleteMilestone}
              onAddMilestone={handleAddNewMilestone}
              onGoalToggle={toggleGoalCompletion}
              onGoalAdd={handleGoalAdd}
              onGoalDelete={deleteGoal}
              editingMilestoneId={editingMilestoneId}
              editingMilestoneText={editingMilestoneText}
              onEditingMilestoneTextChange={updateEditingText}
              onSubmitInlineEdit={handleSubmitInlineEdit}
              onCancelInlineEdit={cancelInlineEdit}
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
          onAddMilestone={addMilestone}
          onMilestoneDelete={deleteMilestone}
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