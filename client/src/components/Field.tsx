import type { InputHTMLAttributes, TextareaHTMLAttributes, ReactNode } from 'react';

// Text field mirroring _Field in lib/screens/blood_request_form_screen.dart
// and the TextField styling used across the app.
export default function Field({
  label,
  icon,
  error,
  textarea,
  className = '',
  ...props
}: {
  label: string;
  icon?: ReactNode;
  error?: string;
  textarea?: boolean;
  className?: string;
} & InputHTMLAttributes<HTMLInputElement> &
  Partial<TextareaHTMLAttributes<HTMLTextAreaElement>>) {
  const shared =
    'w-full rounded-[14px] bg-transparent px-4 py-3 text-[14px] text-textdark outline-none placeholder:text-dim/70';

  return (
    <label className={`block ${className}`}>
      <span className="mb-2 block font-mono text-[10px] font-semibold uppercase tracking-[0.08em] text-dim">
        {label}
      </span>
      <div className={`glass-input relative flex items-center rounded-[14px] ${error ? '!border-danger/70' : ''}`}>
        {icon && (
          <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-dim">
            {icon}
          </span>
        )}
        {textarea ? (
          <textarea
            rows={(props as TextareaHTMLAttributes<HTMLTextAreaElement>).rows ?? 2}
            placeholder={props.placeholder}
            value={props.value as string}
            onChange={props.onChange as React.ChangeEventHandler<HTMLTextAreaElement>}
            className={`${shared} ${icon ? 'pl-12' : ''}`}
          />
        ) : (
          <input
            {...(props as InputHTMLAttributes<HTMLInputElement>)}
            className={`${shared} ${icon ? 'pl-12' : ''}`}
          />
        )}
      </div>
      {error && <span className="mt-1 block text-xs font-medium text-danger">{error}</span>}
    </label>
  );
}
