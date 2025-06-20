import { useState } from 'react';

export function useInlineEdit() {
  const [editingMilestoneId, setEditingMilestoneId] = useState<string | null>(null);
  const [editingMilestoneText, setEditingMilestoneText] = useState<string>('');

  const initiateInlineEdit = (milestoneId: string, currentText: string) => {
    console.log('Initiating inline edit for:', milestoneId);
    setEditingMilestoneId(milestoneId);
    setEditingMilestoneText(currentText);
  };

  const updateEditingText = (text: string) => {
    setEditingMilestoneText(text);
  };

  const cancelInlineEdit = () => {
    console.log('Cancelling inline edit');
    setEditingMilestoneId(null);
    setEditingMilestoneText('');
  };

  const submitInlineEdit = async (
    onSubmit: (milestoneId: string, newText: string) => Promise<boolean>
  ) => {
    if (!editingMilestoneId) return;
    console.log('Submitting inline edit for:', editingMilestoneId, 'New text:', editingMilestoneText);

    const success = await onSubmit(editingMilestoneId, editingMilestoneText);
    if (success) {
      cancelInlineEdit();
    }
  };

  return {
    editingMilestoneId,
    editingMilestoneText,
    initiateInlineEdit,
    updateEditingText,
    cancelInlineEdit,
    submitInlineEdit,
  };
}