import { ChevronDown } from 'lucide-react';

// Mirrors GradeDropdown + _gradeColor in lib/widgets/cgpa_widgets.dart
const GRADES = ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C', 'D', 'F'];

function gradeColor(grade: string): string {
  switch (grade) {
    case 'A+':
    case 'A':
      return '#2e7d5b';
    case 'A-':
    case 'B+':
      return '#407362';
    case 'B':
    case 'B-':
      return '#579d83';
    case 'C':
      return '#e8a838';
    case 'D':
    case 'F':
      return '#d64545';
    default:
      return '#4a4a4a';
  }
}

export function GradeDropdown({
  value,
  onChanged,
}: {
  value: string;
  onChanged: (grade: string) => void;
}) {
  return (
    <div className="glass-tint relative inline-flex items-center rounded-[12px] px-3 py-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]">
      <select
        value={value}
        onChange={(e) => onChanged(e.target.value)}
        className="cursor-pointer appearance-none bg-transparent pr-5 text-[15px] font-bold outline-none"
        style={{ color: gradeColor(value) }}
      >
        {GRADES.map((g) => (
          <option key={g} value={g} style={{ color: gradeColor(g) }}>
            {g}
          </option>
        ))}
      </select>
      <ChevronDown
        size={18}
        className="pointer-events-none absolute right-2 text-primary"
      />
    </div>
  );
}
