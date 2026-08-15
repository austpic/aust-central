import type { LucideIcon } from 'lucide-react';

// Mirrors PrimaryActionButton + SecondaryActionButton in lib/widgets/cgpa_widgets.dart
export function PrimaryActionButton({
  label,
  icon: Icon,
  onPressed,
}: {
  label: string;
  icon: LucideIcon;
  onPressed: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onPressed}
      className="glass-accent glass-sheen flex h-14 w-full items-center justify-center gap-2 rounded-[16px] font-display text-[16px] font-bold text-white transition-transform duration-200 hover:-translate-y-0.5 hover:brightness-105"
    >
      <Icon size={22} />
      {label}
    </button>
  );
}

export function SecondaryActionButton({
  label,
  icon: Icon,
  onPressed,
}: {
  label: string;
  icon: LucideIcon;
  onPressed: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onPressed}
      className="glass flex h-12 w-full items-center justify-center gap-2 rounded-[14px] text-[14px] font-semibold text-primary transition-colors duration-200 hover:-translate-y-0.5 hover:bg-white/70"
    >
      <Icon size={20} />
      {label}
    </button>
  );
}
