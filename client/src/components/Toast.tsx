import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';

type ToastKind = 'default' | 'error' | 'success';

interface Toast {
  id: number;
  message: string;
  kind: ToastKind;
}

const ToastContext = createContext<(message: string, kind?: ToastKind) => void>(
  () => {},
);

// Mirrors Flutter's ScaffoldMessenger.showSnackBar — floating snackbar.
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const idRef = useRef(0);

  const show = useCallback((message: string, kind: ToastKind = 'default') => {
    const id = ++idRef.current;
    setToasts((prev) => [...prev, { id, message, kind }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  return (
    <ToastContext.Provider value={show}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-20 z-[60] flex flex-col items-center gap-2 px-4 lg:bottom-6">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`toast-in pointer-events-auto w-auto max-w-md rounded-2xl border border-white/40 px-4 py-3 text-sm font-semibold text-white shadow-glass backdrop-blur-xl ${
              t.kind === 'error' ? 'bg-danger/85' : t.kind === 'success' ? 'bg-success/85' : 'bg-primary/85'
            }`}
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
