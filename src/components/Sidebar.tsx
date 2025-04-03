import React, { useState } from 'react';
import { Plus, X, Trash2 } from 'lucide-react';
import type { Dimension, Milestone } from '../types';

interface SidebarProps {
  onAddMilestone: (milestone: Omit<Milestone, 'id'>) => void;
  onMilestoneDelete?: (milestone: Milestone) => void;
  dimension: Dimension | null;
  month: number | null;
  milestones: Milestone[];
  isOpen: boolean;
  onClose: () => void;
}

// Define months in the order they appear in the CSV (Apr-Mar)
const monthsInOrder = [
  { number: 4, name: 'April' },
  { number: 5, name: 'May' },
  { number: 6, name: 'June' },
  { number: 7, name: 'July' },
  { number: 8, name: 'August' },
  { number: 9, name: 'September' },
  { number: 10, name: 'October' },
  { number: 11, name: 'November' },
  { number: 12, name: 'December' },
  { number: 1, name: 'January' },
  { number: 2, name: 'February' },
  { number: 3, name: 'March' }
];

// Get month name from number
function getMonthName(monthNumber: number): string {
  const month = monthsInOrder.find(m => m.number === monthNumber);
  return month ? month.name : 'Unknown';
}

export function Sidebar({ onAddMilestone, onMilestoneDelete, dimension, month, milestones, isOpen, onClose }: SidebarProps) {
  const [description, setDescription] = useState('');
  const [selectedDimension, setSelectedDimension] = useState<Dimension | null>(dimension);
  const [selectedMonth, setSelectedMonth] = useState<number | null>(month);

  // Update local state when props change
  React.useEffect(() => {
    setSelectedDimension(dimension);
    setSelectedMonth(month);
  }, [dimension, month]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDimension || !selectedMonth) return;

    onAddMilestone({
      dimension: selectedDimension,
      month: selectedMonth,
      description,
      completed: false,
      futureTense: description,
      pastTense: description,
    });
    setDescription('');
  };

  const handleDelete = (milestone: Milestone) => {
    if (onMilestoneDelete) {
      onMilestoneDelete(milestone);
    } else {
      console.error('Delete handler not implemented');
    }
  };

  const relevantMilestones = selectedDimension && selectedMonth
    ? milestones.filter(m => m.dimension === selectedDimension && m.month === selectedMonth)
    : [];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">
            {selectedDimension && selectedMonth 
              ? `Milestones for ${selectedDimension} in ${getMonthName(selectedMonth)}` 
              : 'Add New Milestone'}
          </h2>
          <button onClick={onClose}>
            <X className="w-6 h-6" />
          </button>
        </div>

        {selectedDimension && selectedMonth ? (
          <>
            <form onSubmit={handleSubmit} className="mb-6">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  New Milestone Description (Write as if already achieved)
                </label>
                <div className="flex gap-2">
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="flex-1 border rounded-lg p-2"
                    rows={2}
                    placeholder="e.g., Completed a marathon with a time of 4:30"
                  />
                  <button
                    type="submit"
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </form>

            <div className="space-y-3">
              <h3 className="font-medium text-gray-700">Existing Milestones</h3>
              {relevantMilestones.length === 0 ? (
                <p className="text-sm text-gray-500">No milestones yet</p>
              ) : (
                relevantMilestones.map(milestone => (
                  <div 
                    key={milestone.id} 
                    className="flex items-start gap-2 p-3 bg-gray-50 rounded-lg group"
                  >
                    <p className="flex-1 text-sm text-gray-600">{milestone.description}</p>
                    <button
                      onClick={() => handleDelete(milestone)}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded-full hover:bg-gray-200 transition-opacity duration-200"
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Dimension
              </label>
              <select
                value={selectedDimension || ''}
                onChange={(e) => setSelectedDimension(e.target.value as Dimension)}
                className="w-full border rounded-lg p-2"
              >
                <option value="">Select dimension</option>
                <option value="family">Family</option>
                <option value="health">Health</option>
                <option value="wealth">Wealth</option>
                <option value="self-realization">Self-realization</option>
                <option value="friends">Friends</option>
                <option value="leisure">Leisure</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Month
              </label>
              <select
                value={selectedMonth || ''}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="w-full border rounded-lg p-2"
              >
                <option value="">Select month</option>
                {monthsInOrder.map((m) => (
                  <option key={m.number} value={m.number}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}