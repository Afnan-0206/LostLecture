import React from 'react';
import { FolderOpen } from 'lucide-react';
import { InteractiveHoverButton } from '../ui/interactive-hover-button';

const EmptyState = ({
  icon: Icon = FolderOpen,
  title = 'No resources found',
  description = 'Try adjusting your search criteria or filters, or be the first to contribute.',
  actionLabel,
  onAction,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center bg-white border border-dashed border-slate-300 rounded-2xl max-w-lg mx-auto my-8 shadow-xs">
      <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 mb-4">
        <Icon className="w-7 h-7" />
      </div>
      <h3 className="text-lg font-semibold text-slate-900 mb-1">{title}</h3>
      <p className="text-sm text-slate-500 mb-6 max-w-sm">{description}</p>
      {actionLabel && onAction && (
        <InteractiveHoverButton
          onClick={onAction}
          variant="primary"
          size="md"
          text={actionLabel}
        />
      )}
    </div>
  );
};

export default EmptyState;

