import { ArrowLeft, BrainCircuit, Crosshair, Play, Activity, Flag, CheckCircle2, Hourglass, AlertTriangle } from 'lucide-react';
import StatCard from '../components/StatCard';
import InfoCard from '../components/InfoCard';
import ProgressRing from '../components/ProgressRing';
import { PrimaryActionButton } from '../components/ActionButtons';
import { useCgpaWhatifViewModel } from '../viewmodels/useCgpaWhatifViewModel';

// Mirrors CgpaWhatifScreen in lib/screens/cgpa_whatif_screen.dart.
// v7: numbered target row + gradient achievability ring over the result.
export default function CgpaWhatifView() {
  const vm = useCgpaWhatifViewModel();

  const requiredFrac = vm.result ? Math.min(Math.max(vm.result.requiredGpa, 0), 4) / 4 : 0;

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
        <span className="font-display text-[20px] font-bold tracking-tight text-textdark">What-If Calculator</span>
        <span className="w-9" />
      </div>

      {/* Header card */}
      <div className="glass-accent glass-sheen mt-4 rounded-[20px] p-6 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-[16px] bg-white/20">
          <BrainCircuit size={30} className="text-white" />
        </div>
        <div className="mt-4 font-display text-[20px] font-bold text-white">Plan Your Future CGPA</div>
        <p className="mx-auto mt-2 max-w-xs text-[13px] font-medium leading-[1.5] text-white/85">
          Enter your target CGPA to see what you need to achieve in your remaining semesters.
        </p>
      </div>

      {/* Target input — numbered form row */}
      <div className="eyebrow-rule mb-3 mt-6 pl-1">Target CGPA</div>
      <div className="glass flex items-center gap-3 rounded-[16px] p-3 transition-shadow duration-200 hover:shadow-glass-lg">
        <span className="fnum flex h-6 w-6 shrink-0 items-center justify-center">1</span>
        <span className="glass-tint mr-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] text-mint-ink">
          <Crosshair size={20} />
        </span>
        <input
          type="number"
          step="0.01"
          min="0"
          max="4"
          inputMode="decimal"
          value={vm.target}
          onChange={(e) => vm.setTarget(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') vm.simulate();
          }}
          placeholder="e.g. 3.80"
          className="w-full bg-transparent py-2 font-display text-[18px] font-bold text-textdark outline-none placeholder:font-medium placeholder:text-dim/60"
        />
      </div>

      <div className="mt-6">
        <PrimaryActionButton label="Simulate" icon={Play} onPressed={vm.simulate} />
      </div>

      {vm.result && (
        <div className="mt-6">
          {/* Achievability ring */}
          <div className="glass glass-sheen flex flex-col items-center px-6 py-8">
            <ProgressRing
              size={140}
              strokeWidth={10}
              progress={requiredFrac}
              colors={vm.result.isAchievable ? ['#407362', '#579d83'] : ['#FF6E56', '#d64545']}
            >
              <span className="font-display text-[32px] font-bold leading-none text-textdark">
                {vm.result.requiredGpa.toFixed(2)}
              </span>
              <span className="mt-1 font-mono text-[9.5px] font-semibold uppercase tracking-[0.08em] text-mint-ink">
                Required GPA
              </span>
            </ProgressRing>
            <div className="mt-2 text-[11.5px] text-dim">
              needed to reach {vm.result.targetCgpa.toFixed(2)} in {vm.result.remainingCredits} remaining credits
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-4">
            <StatCard
              label="Current CGPA"
              value={vm.result.currentCgpa.toFixed(2)}
              icon={Activity}
              accentColor="#579d83"
            />
            <StatCard
              label="Required GPA"
              value={vm.result.requiredGpa.toFixed(2)}
              icon={Flag}
              accentColor={vm.result.isAchievable ? '#407362' : '#d64545'}
            />
          </div>
          <div className="mt-4 grid grid-cols-2 gap-4">
            <StatCard
              label="Completed Cr."
              value={vm.result.completedCredits.toFixed(0)}
              icon={CheckCircle2}
              accentColor="#0369A1"
            />
            <StatCard
              label="Remaining Cr."
              value={vm.result.remainingCredits.toFixed(0)}
              icon={Hourglass}
              accentColor="#e8a838"
            />
          </div>
          <div className="mt-4">
            <InfoCard
              title={vm.result.isAchievable ? 'Achievable!' : 'Not Achievable'}
              message={vm.result.message}
              icon={vm.result.isAchievable ? CheckCircle2 : AlertTriangle}
              isSuccess={vm.result.isAchievable}
            />
          </div>
        </div>
      )}
    </div>
  );
}
