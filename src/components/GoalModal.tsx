import React, { useState } from 'react';
import { X } from 'lucide-react';
import type { Dimension } from '../types';

interface GoalModalProps {
  dimension: Dimension;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (description: string) => void;
}

export function GoalModal({ dimension, isOpen, onClose, onSubmit }: GoalModalProps) {
  const [description, setDescription] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(description);
    setDescription('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Add Goal for {dimension}</h2>
          <button onClick={onClose}>
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Goal Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full border rounded-lg p-2"
              rows={3}
              placeholder="e.g., Run 5km three times a week"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200"
          >
            Add Goal
          </button>
        </form>
      </div>
    </div>
  );
}