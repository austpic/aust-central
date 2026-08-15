import type { ReactNode } from 'react';
import { X } from 'lucide-react';

// Lightweight modal used for dialogs (Flutter's AlertDialog/showDialog)
// and bottom-sheet style forms. Portal-based, rendered over everything.
export function Dialog({
  title,
  children,
  onClose,
  wide = false,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
  wide?: boolean;
}) {
  return (
    <div className="fade-in fixed inset-0 z-50 flex items-end justify-center bg-darkgreen/30 p-4 backdrop-blur-sm sm:items-center" onClick={onClose}>
      <div
        className={`glass-strong glass-pop w-full ${wide ? 'max-w-3xl' : 'max-w-md'} rounded-t-[28px] p-6 sm:rounded-[24px]`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-4 h-[5px] w-10 rounded-full bg-labgrey/40 sm:hidden" />
        <div className="flex items-center justify-between">
          <h3 className="font-display text-[20px] font-bold tracking-tight text-textdark">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="glass-pill flex h-9 w-9 items-center justify-center rounded-full text-dim"
          >
            <X size={20} />
          </button>
        </div>
        <div className="mt-6 max-h-[70vh] overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}

// Mirrors the AlertDialog (confirm/cancel) used in the to-do list.
export function ConfirmDialog({
  title,
  message,
  confirmLabel,
  cancelLabel,
  danger = false,
  onConfirm,
  onCancel,
}: {
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fade-in fixed inset-0 z-50 flex items-center justify-center bg-darkgreen/30 p-4 backdrop-blur-sm" onClick={onCancel}>
      <div
        className="glass-strong glass-pop w-full max-w-sm rounded-[22px] p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="font-display text-lg font-bold tracking-tight text-textdark">{title}</h3>
        <p className="mt-2 text-sm text-dim">{message}</p>
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg px-4 py-2 text-sm font-semibold text-primary"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`rounded-lg px-4 py-2 text-sm font-semibold ${
              danger ? 'text-danger' : 'text-primary'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
