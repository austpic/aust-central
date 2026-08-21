// Six-digit one-time-code input, styled identically to the auth form fields
// (Field.tsx) so the verify-email and reset-password screens are
// indistinguishable from Login/Register. Digits only, six maximum; used by
// both OTP screens, never duplicated.
export default function OtpInput({
  value,
  onChange,
  error,
  disabled,
  autoFocus,
}: {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
  autoFocus?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-2 block font-mono text-[10px] font-semibold uppercase tracking-[0.08em] text-dim">
        Verification code
      </span>
      <div className={`glass-input relative flex items-center rounded-[14px] ${error ? '!border-danger/70' : ''}`}>
        <input
          value={value}
          disabled={disabled}
          autoFocus={autoFocus}
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="[0-9]*"
          maxLength={6}
          placeholder="000000"
          onChange={(e) => onChange(e.target.value.replace(/\D/g, '').slice(0, 6))}
          className="w-full rounded-[14px] bg-transparent px-4 py-3 text-center font-mono text-[22px] font-bold tracking-[0.5em] text-textdark outline-none placeholder:text-dim/40 disabled:opacity-70"
        />
      </div>
      {error && <span className="mt-1 block text-xs font-medium text-danger">{error}</span>}
    </label>
  );
}