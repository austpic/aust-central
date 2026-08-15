import type { LucideIcon } from 'lucide-react';

// Mirrors InfoCard in lib/widgets/cgpa_widgets.dart
export default function InfoCard({
  title,
  message,
  icon: Icon,
  isSuccess = true,
}: {
  title: string;
  message: string;
  icon: LucideIcon;
  isSuccess?: boolean;
}) {
  const accent = isSuccess ? '#2e7d5b' : '#e8a838';
  return (
    <div
      className="glass w-full rounded-[18px] p-6"
      style={{
        border: `1.5px solid ${accent}4d`,
        boxShadow: `inset 0 1px 0 rgba(255,255,255,0.7), 0 6px 20px ${accent}1f`,
      }}
    >
      <div className="flex items-center gap-3">
        <div
          className="flex h-[42px] w-[42px] items-center justify-center rounded-[12px]"
          style={{ backgroundColor: `${accent}1f` }}
        >
          <Icon size={22} style={{ color: accent }} />
        </div>
        <div className="flex-1 font-display text-[17px] font-bold" style={{ color: accent }}>
          {title}
        </div>
      </div>
      <p className="mt-4 text-[14px] font-medium leading-[1.5] text-dim">
        {message}
      </p>
    </div>
  );
}
