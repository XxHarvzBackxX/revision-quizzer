import { X } from 'lucide-react';
import { useEffect } from 'react';
import type { Toast } from '../types';

const TOAST_TTL_MS = 120_000;

export function ToastHost({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: number) => void }) {
  useEffect(() => {
    const timers = toasts.map((toast) => {
      const remaining = Math.max(0, TOAST_TTL_MS - (Date.now() - toast.createdAt));
      return window.setTimeout(() => onDismiss(toast.id), remaining);
    });

    return () => timers.forEach(window.clearTimeout);
  }, [toasts, onDismiss]);

  return (
    <div className="toast-region" aria-live="polite" aria-label="Notifications">
      {toasts.map((toast) => (
        <div className={`toast ${toast.kind}`} key={toast.id}>
          <span>{toast.message}</span>
          <button onClick={() => onDismiss(toast.id)} aria-label="Dismiss notification"><X size={16} /></button>
        </div>
      ))}
    </div>
  );
}
