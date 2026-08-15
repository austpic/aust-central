import type { ReactNode } from 'react';

// Generic pill filter — mirrors ChoiceChip used across screens
// (selected = dark green fill, unselected = mint chip).
export default function FilterChip({
  label,
  selected,
  onSelect,
  icon,
}: {
  label: string;
  selected: boolean;
  onSelect: () => void;
  icon?: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`inline-flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-[13px] font-semibold transition-all duration-200 hover:-translate-y-0.5 ${
        selected ? 'glass-pill-active' : 'glass-pill text-textdark'
      }`}
    >
      {icon}
      {label}
    </button>
  );
}
