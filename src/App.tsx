import React, { useState, useEffect } from 'react';
import { Grid } from './components/Grid';
import { Sidebar } from './components/Sidebar';
import { GoalModal } from './components/GoalModal';
import { Target, Plus, Save } from 'lucide-react';
import type { Milestone, Goal, Dimension } from './types';
import { importFromCSV, exportToCSV } from './utils/csvHandler';

function App() {
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [goalModalOpen, setGoalModalOpen] = useState(false);
  const [selectedDimension, setSelectedDimension] = useState<Dimension | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const [csvLoaded, setCsvLoaded] = useState(false);

  // Load data from CSV on component mount
  useEffect(() => {
    const loadCSVData = async () => {
      try {
        console.log("Loading CSV data...");
        const data = await importFromCSV();
        console.log("CSV data loaded:", data);
        
        if (data) {
          // Convert the new milestone data structure to arrays for our app
          const newMilestones: Milestone[] = [];
          let milestoneIdCounter = 1;

          // Process milestones by dimension and month
          Object.entries(data.milestonesByDimension).forEach(([dimension, monthData]) => {
            Object.entries(monthData).forEach(([month, milestoneTexts]) => {
              const monthNumber = parseInt(month, 10);
              
              // Get completion status for this dimension/month with fallback
              const dimensionStatus = data.dimensionCompletionStatus[dimension];
              const completionStatus = dimensionStatus && dimensionStatus.milestones && 
                                      dimensionStatus.milestones[monthNumber] ? 
                                      dimensionStatus.milestones[monthNumber] : [];
              
              // Create milestone objects for each text
              milestoneTexts.forEach((text, index) => {
                if (text) {
                  const isCompleted = completionStatus[index] || false;
                  
                  newMilestones.push({
                    id: `m-${milestoneIdCounter++}`,
                    dimension: dimension as Dimension,
                    month: monthNumber,
                    description: text,
                    completed: isCompleted,
                    futureTense: text, // Simplified for now
                    pastTense: text // Simplified for now
                  });
                }
              });
            });
          });

          // Convert goals by dimension to array
          const newGoals: Goal[] = [];
          let goalIdCounter = 1;
          
          Object.entries(data.goalsByDimension).forEach(([dimension, goalTexts]) => {
            // Get completion status for this dimension's goals with fallback
            const dimensionStatus = data.dimensionCompletionStatus[dimension];
            const completionStatus = dimensionStatus && dimensionStatus.goals ? 
                                    dimensionStatus.goals : [];
            
            goalTexts.forEach((text, index) => {
              if (text) {
                const isCompleted = completionStatus[index] || false;
                
                newGoals.push({
                  id: `g-${goalIdCounter++}`,
                  dimension: dimension as Dimension,
                  description: text,
                  completed: isCompleted
                });
              }
            });
          });

          setMilestones(newMilestones);
          setGoals(newGoals);
          setCsvLoaded(true);
        }
      } catch (error) {
        console.error('Error loading CSV data:', error);
      }
    };

    loadCSVData();
  }, []);

  // Save data to CSV whenever milestones or goals change
  useEffect(() => {
    // Only save after initial CSV load to prevent overwriting on first load
    if (csvLoaded) {
      const saveData = async () => {
        try {
          await exportToCSV({ milestones, goals });
        } catch (error) {
          console.error('Error saving to CSV:', error);
        }
      };

      // Debounce the save operation
      const timer = setTimeout(() => {
        saveData();
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [milestones, goals, csvLoaded]);

  // Debug logging for state changes
  useEffect(() => {
    console.log("Current app state:", { 
      milestones: milestones.length, 
      goals: goals.length,
      csvLoaded
    });
  }, [milestones, goals, csvLoaded]);

  const handleAddMilestone = (newMilestone: Omit<Milestone, 'id'>) => {
    setMilestones(prev => [...prev, { ...newMilestone, id: Date.now().toString() }]);
  };

  const handleMilestoneClick = (milestone: Milestone) => {
    setMilestones(prev =>
      prev.map(m =>
        m.id === milestone.id ? { ...m, completed: !m.completed } : m
      )
    );
  };

  const handleMilestoneEdit = (milestone: Milestone) => {
    setSelectedDimension(milestone.dimension);
    setSelectedMonth(milestone.month);
    setSidebarOpen(true);
  };

  const handleMilestoneDelete = (milestone: Milestone) => {
    setMilestones(prev => prev.filter(m => m.id !== milestone.id));
  };

  const handleAddNewMilestone = (dimension: Dimension, month: number) => {
    setSelectedDimension(dimension);
    setSelectedMonth(month);
    setSidebarOpen(true);
  };

  const handleGoalToggle = (goal: Goal) => {
    setGoals(prev =>
      prev.map(g =>
        g.id === goal.id ? { ...g, completed: !g.completed } : g
      )
    );
  };

  const handleGoalAdd = (dimension: Dimension) => {
    setSelectedDimension(dimension);
    setGoalModalOpen(true);
  };

  const handleGoalSubmit = (description: string) => {
    if (selectedDimension) {
      setGoals(prev => [...prev, {
        id: Date.now().toString(),
        dimension: selectedDimension,
        description,
        completed: false,
      }]);
    }
  };

  const handleGoalDelete = (goal: Goal) => {
    setGoals(prev => prev.filter(g => g.id !== goal.id));
  };

  const calculateProgress = () => {
    // Make sure milestones is defined and has a length property
    if (!milestones || !Array.isArray(milestones) || milestones.length === 0) {
      return 0;
    }
    
    const completed = milestones.filter(m => m.completed).length;
    return Math.round((completed / milestones.length) * 100);
  };

  const handleManualSave = async () => {
    try {
      await exportToCSV({ milestones, goals });
      alert('Data saved successfully!');
    } catch (error) {
      console.error('Error manually saving to CSV:', error);
      alert('Error saving data. Please try again.');
    }
  };

  return (
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
              <button 
                onClick={handleManualSave}
                className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center"
              >
                <Save className="w-4 h-4 mr-1" />
                Save
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="w-full mx-auto px-2 py-4">
        <div className="bg-white rounded-lg shadow-sm p-2">
          <Grid 
            milestones={milestones} 
            goals={goals}
            onMilestoneClick={handleMilestoneClick}
            onMilestoneEdit={handleMilestoneEdit}
            onMilestoneDelete={handleMilestoneDelete}
            onAddMilestone={handleAddNewMilestone}
            onGoalToggle={handleGoalToggle}
            onGoalAdd={handleGoalAdd}
            onGoalDelete={handleGoalDelete}
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
  );
}

export default App;