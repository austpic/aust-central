import type { LucideIcon } from 'lucide-react';

// Mirrors StatCard in lib/widgets/cgpa_widgets.dart, restyled with the
// v7 tinted-swatch + display-font number treatment.
export default function StatCard({
  label,
  value,
  icon: Icon,
  accentColor = '#0D7A3D',
}: {
  label: string;
  value: string;
  icon: LucideIcon;
  accentColor?: string;
}) {
  return (
    <div className="glass glass-sheen flex flex-col items-center rounded-[20px] p-6 text-center transition-shadow duration-200 hover:shadow-glass-lg">
      <div
        className="flex h-[52px] w-[52px] items-center justify-center rounded-[16px]"
        style={{ backgroundColor: `${accentColor}1a`, border: `1px solid ${accentColor}2e` }}
      >
        <Icon size={24} style={{ color: accentColor }} />
      </div>
      <div className="mt-3 font-display text-[28px] font-bold leading-[1.1] tracking-tight text-textdark">
        {value}
      </div>
      <div className="eyebrow mt-2">{label}</div>
    </div>
  );
}
