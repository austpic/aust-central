// Mirrors _SectionLabel in lib/screens/blood_bank_screen.dart
export default function SectionLabel({
  label,
  count,
}: {
  label: string;
  count: number;
}) {
  return (
    <div className="mb-2 flex items-baseline gap-2 px-1">
      <span className="eyebrow-rule">{label}</span>
      <span className="tag-mint rounded-full px-2 py-0.5 font-mono text-[10px] font-bold">· {count}</span>
    </div>
  );
}
