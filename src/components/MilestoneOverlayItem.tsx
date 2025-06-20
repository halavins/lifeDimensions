import type { Milestone } from '../types';

interface MilestoneOverlayItemProps {
  item: Milestone;
}

export function MilestoneOverlayItem({ item }: MilestoneOverlayItemProps) {
  return (
    <div className="p-1 sm:p-1.5 rounded bg-white shadow-lg cursor-grabbing">
      <p className="text-xs text-gray-700 break-words">{item.description}</p>
    </div>
  );
}