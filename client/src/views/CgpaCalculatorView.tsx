import { useState } from 'react';
import {
  ArrowLeft,
  Calculator as CalcIcon,
  School,
  TrendingUp,
  BarChart3,
  BookOpen,
  BrainCircuit,
  History,
} from 'lucide-react';
import CourseCard from '../components/CourseCard';
import StatCard from '../components/StatCard';
import ProgressRing from '../components/ProgressRing';
import { PrimaryActionButton, SecondaryActionButton } from '../components/ActionButtons';
import { useCgpaCalculatorViewModel } from '../viewmodels/CgpaContext';

// Mirrors CgpaCalculatorScreen in lib/screens/cgpa_calculator_screen.dart.
// The header shows the v7 gradient progress ring (driven by the ViewModel's
// cumulative CGPA) with a "credit hours" caption.
export default function CgpaCalculatorView() {
  const vm = useCgpaCalculatorViewModel();
  const [showResults, setShowResults] = useState(false);

  const totalCredits =
    vm.history.reduce((sum, r) => sum + r.totalCredits, 0) + vm.totalCurrentCredits;
  const currentCgpa = Number.isFinite(vm.cumulativeCgpa) ? vm.cumulativeCgpa : 0;

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
        <span className="font-display text-[20px] font-bold tracking-tight text-textdark">
          CGPA Calculator
        </span>
        <span className="glass-tint flex h-11 w-11 items-center justify-center rounded-[12px] text-mint-ink">
          <CalcIcon size={22} />
        </span>
      </div>

      {/* Ring hero */}
      <div className="glass glass-sheen mt-6 flex flex-col items-center px-6 py-8">
        <ProgressRing
          size={150}
          strokeWidth={10}
          progress={currentCgpa / 4}
          colors={['#407362', '#57C7EC', '#B98BF2']}
        >
          <span className="font-display text-[36px] font-bold leading-none text-textdark">
            {currentCgpa.toFixed(2)}
          </span>
          <span className="mt-1 font-mono text-[9.5px] font-semibold uppercase tracking-[0.08em] text-mint-ink">
            CGPA
          </span>
        </ProgressRing>
        <div className="mt-2 text-[11.5px] text-dim">
          across {totalCredits} credit hours
        </div>
        <div className="mt-4 flex items-center gap-2 rounded-full bg-white/50 px-4 py-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.08em] text-dim">
          <School size={13} className="text-mint-ink" />
          {vm.courses.length} courses this semester
        </div>
      </div>

      {/* Select grades */}
      <div className="eyebrow-rule mt-6 pl-1">Select Grades</div>
      <div className="mt-3 grid grid-cols-1 gap-3">
        {vm.courses.map((course, index) => (
          <CourseCard
            key={index}
            index={index}
            courseName={course.courseName}
            credits={course.credits}
            grade={course.grade}
            onGradeChanged={(grade) => vm.updateGrade(index, grade)}
          />
        ))}
      </div>

      <div className="mt-6">
        <PrimaryActionButton
          label="Calculate GPA"
          icon={TrendingUp}
          onPressed={() => {
            vm.calculate();
            setShowResults(true);
          }}
        />
      </div>

      {showResults && vm.isCalculated && (
        <div className="mt-6">
          <div className="grid grid-cols-2 gap-4">
            <StatCard
              label="Semester GPA"
              value={vm.semesterGpa.toFixed(2)}
              icon={TrendingUp}
              accentColor="#407362"
            />
            <StatCard
              label="Cumulative CGPA"
              value={vm.cumulativeCgpa.toFixed(2)}
              icon={BarChart3}
              accentColor="#579d83"
            />
          </div>
          <div className="mt-4 grid grid-cols-2 gap-4">
            <StatCard
              label="Total Credits"
              value={vm.totalCurrentCredits.toFixed(1)}
              icon={BookOpen}
              accentColor="#e8a838"
            />
            <StatCard
              label="Courses"
              value={`${vm.courses.length}`}
              icon={School}
              accentColor="#0369A1"
            />
          </div>
        </div>
      )}

      {/* Bottom buttons */}
      <div className="mt-6 grid grid-cols-2 gap-4">
        <SecondaryActionButton
          label="What-If Calculator"
          icon={BrainCircuit}
          onPressed={vm.goToWhatIf}
        />
        <SecondaryActionButton label="History" icon={History} onPressed={vm.goToHistory} />
      </div>
    </div>
  );
}
