import React from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { InteractiveHoverButton } from '../ui/interactive-hover-button';

const ConfirmationDialog = ({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  isDestructive = false,
  onConfirm,
  onCancel,
  loading = false,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 transition-all">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center ${
                isDestructive ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'
              }`}
            >
              <AlertTriangle className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
          </div>
          <button
            onClick={onCancel}
            disabled={loading}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-sm text-slate-600 mb-6">{message}</p>

        <div className="flex items-center justify-end gap-3">
          <InteractiveHoverButton
            type="button"
            onClick={onCancel}
            disabled={loading}
            variant="secondary"
            size="sm"
            text={cancelLabel}
          />
          <InteractiveHoverButton
            type="button"
            onClick={onConfirm}
            loading={loading}
            disabled={loading}
            variant={isDestructive ? 'danger' : 'primary'}
            size="sm"
            text={confirmLabel}
          />
        </div>
      </div>
    </div>
  );
};

export default ConfirmationDialog;

