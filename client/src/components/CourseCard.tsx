import { GradeDropdown } from './GradeDropdown';

// Mirrors CourseCard in lib/widgets/cgpa_widgets.dart, rendered with the
// v7 numbered form-row anatomy (.formrow + .fnum).
export default function CourseCard({
  index,
  courseName,
  credits,
  grade,
  onGradeChanged,
}: {
  index: number;
  courseName: string;
  credits: number;
  grade: string;
  onGradeChanged: (grade: string) => void;
}) {
  return (
    <div className="glass flex items-center gap-3 rounded-[20px] p-3 transition-shadow duration-200 hover:shadow-glass-lg">
      <span className="fnum flex h-6 w-6 shrink-0 items-center justify-center">{index + 1}</span>
      <div className="min-w-0 flex-1">
        <div className="truncate text-[14px] font-bold text-textdark">{courseName}</div>
        <div className="mt-0.5 font-mono text-[10px] font-semibold uppercase tracking-[0.08em] text-dim">
          {credits.toFixed(1)} credit hrs
        </div>
      </div>
      <div className="shrink-0">
        <GradeDropdown value={grade} onChanged={onGradeChanged} />
      </div>
    </div>
  );
}
