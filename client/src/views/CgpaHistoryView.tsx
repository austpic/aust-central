import { ArrowLeft, Trophy, Star, ThumbsUp, MoveHorizontal, TrendingDown } from 'lucide-react';
import ProgressRing from '../components/ProgressRing';
import { useCgpaHistoryViewModel } from '../viewmodels/useCgpaHistoryViewModel';
import type { SemesterRecord } from '../models/courseGrade';
import type { LucideIcon } from 'lucide-react';

function gpaColor(gpa: number): string {
  if (gpa >= 3.75) return '#0D7A3D';
  if (gpa >= 3.5) return '#2BC97A';
  if (gpa >= 3.0) return '#0369A1';
  if (gpa >= 2.5) return '#B45309';
  return '#C1442D';
}

function gpaIcon(gpa: number): LucideIcon {
  if (gpa >= 3.75) return Trophy;
  if (gpa >= 3.5) return Star;
  if (gpa >= 3.0) return ThumbsUp;
  if (gpa >= 2.5) return MoveHorizontal;
  return TrendingDown;
}

// Mirrors CgpaHistoryScreen + _TimelineCard in lib/screens/cgpa_history_screen.dart.
// v7: gradient cumulative ring in the header + tinted timeline chips.
export default function CgpaHistoryView() {
  const vm = useCgpaHistoryViewModel();

  const latest = vm.history[vm.history.length - 1];
  const cumulativeFrac = latest ? Math.min(Math.max(latest.cumulativeCgpa, 0), 4) / 4 : 0;

  return (
    <div className="mx-auto w-full max-w-2xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => history.back()}
          aria-label="Back"
          className="glass flex h-11 w-11 items-center justify-center rounded-[12px] text-mint-ink transition-transform duration-200 hover:-translate-y-0.5"
        >
          <ArrowLeft size={18} />
        </button>
        <span className="font-display text-[20px] font-bold tracking-tight text-textdark">CGPA History</span>
        <span className="w-9" />
      </div>

      {/* Summary hero */}
      <div className="glass glass-sheen mt-4 flex items-center gap-5 p-6">
        <ProgressRing size={112} strokeWidth={10} progress={cumulativeFrac} colors={['#6EF2A5', '#57C7EC', '#B98BF2']}>
          <span className="font-display text-[24px] font-bold leading-none text-textdark">
            {latest ? latest.cumulativeCgpa.toFixed(2) : '—'}
          </span>
          <span className="mt-0.5 font-mono text-[8.5px] font-semibold uppercase tracking-[0.08em] text-mint-ink">
            Cumulative
          </span>
        </ProgressRing>
        <div className="min-w-0 flex-1">
          <div className="eyebrow-rule">Academic Journey</div>
          <div className="mt-1 font-display text-[19px] font-bold text-textdark">
            {vm.history.length} Semesters Completed
          </div>
          <p className="mt-1 text-[12.5px] leading-[1.5] text-dim">
            Track your progress term by term.
          </p>
        </div>
      </div>

      {/* Timeline */}
      <div className="mt-6 grid grid-cols-1 gap-4">
        {vm.history.map((record, index) => (
          <TimelineCard
            key={record.semesterName}
            record={record}
            isFirst={index === 0}
            isLast={index === vm.history.length - 1}
          />
        ))}
      </div>
    </div>
  );
}

function TimelineCard({
  record,
  isFirst,
  isLast,
}: {
  record: SemesterRecord;
  isFirst: boolean;
  isLast: boolean;
}) {
  const color = gpaColor(record.semesterGpa);
  const Icon = gpaIcon(record.semesterGpa);

  return (
    <div className="flex items-stretch">
      {/* Timeline indicator */}
      <div className="flex w-11 flex-col items-center">
        {!isFirst && <div className="w-0.5 flex-1 bg-mint-ink/20" />}
        <div
          className="flex h-9 w-9 items-center justify-center rounded-full"
          style={{
            backgroundColor: `${color}1f`,
            border: `2.5px solid ${color}`,
          }}
        >
          <Icon size={18} style={{ color }} />
        </div>
        {!isLast && <div className="w-0.5 flex-1 bg-mint-ink/20" />}
      </div>

      {/* Card */}
      <div className="glass glass-sheen ml-4 flex-1 rounded-[18px] p-4 transition-shadow duration-200 hover:shadow-glass-lg">
        <div className="flex items-center">
          <span className="flex-1 font-display text-[16px] font-bold text-textdark">
            {record.semesterName}
          </span>
          <span
            className="rounded-lg px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.06em]"
            style={{ backgroundColor: `${color}1a`, color }}
          >
            {record.totalCredits} Cr
          </span>
        </div>
        <div className="mt-4 flex items-center">
          <GpaStat label="Semester GPA" value={record.semesterGpa.toFixed(2)} color={color} />
          <div className="mx-6 h-9 w-[1.5px] bg-glass-border" />
          <GpaStat label="Cumulative CGPA" value={record.cumulativeCgpa.toFixed(2)} color="#2BC97A" />
        </div>
      </div>
    </div>
  );
}

function GpaStat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div>
      <div className="font-display text-[22px] font-bold leading-[1.1]" style={{ color }}>
        {value}
      </div>
      <div className="mt-1 font-mono text-[9.5px] font-semibold uppercase tracking-[0.08em] text-dim">
        {label}
      </div>
    </div>
  );
}
