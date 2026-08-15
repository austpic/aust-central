import { ArrowLeft, History, MapPin } from 'lucide-react';
import { useScheduleViewModel } from '../viewmodels/useScheduleViewModel';

// Mirrors SchedulePage in lib/screens/schedule_page.dart.
export default function ScheduleView() {
  const vm = useScheduleViewModel();

  return (
    <div className="mx-auto w-full max-w-3xl">
      {/* Header */}
      <div className="flex items-center">
        <button
          type="button"
          onClick={() => history.back()}
          aria-label="Back"
          className="glass flex h-11 w-11 items-center justify-center rounded-full text-textdark transition-transform duration-200 hover:-translate-y-0.5"
        >
          <ArrowLeft size={24} />
        </button>
        <span className="ml-1 font-display text-[22px] font-bold tracking-tight text-textdark">Transport</span>
      </div>

      {/* Location card */}
      <div className="glass-accent glass-sheen mt-4 rounded-[20px] p-4">
        <div className="flex items-start">
          <div className="flex flex-col items-center">
            <MapPin size={24} className="text-white" />
            <div className="h-[100px] w-0.5 bg-white/40" />
            <MapPin size={24} className="text-white" />
          </div>
          <div className="ml-3 flex-1">
            <div className="text-[12px] font-semibold text-white/80">From</div>
            <div className="mt-1 rounded-[30px] border border-white/30 bg-white/20 px-4 py-3 text-[15px] font-semibold text-white">
              {vm.fromLocation}
            </div>
            <div className="mt-3 text-[12px] font-semibold text-white/80">To</div>
            <div className="mt-1 rounded-[30px] border border-white/30 bg-white/20 px-4 py-3 text-[15px] font-semibold text-white">
              {vm.toLocation}
            </div>
          </div>
        </div>
      </div>

      {/* Schedule */}
      <div className="eyebrow-rule mt-6">Choose Schedule</div>

      <div className="mt-4">
        {vm.schedules.map((s, index) => (
          <div key={index}>
            {index > 0 && <div className="h-px bg-glass-border" />}
            <div className="flex items-center py-3">
              <History size={28} className="shrink-0 text-dim" />
              <span className="ml-4 flex-1 font-display text-[18px] font-bold tracking-tight text-textdark">
                {s.time}
              </span>
              <button
                type="button"
                onClick={() => vm.selectTime(s.time)}
                className="glass-accent rounded-[30px] px-6 py-3 text-[14px] font-bold text-white transition-transform duration-200 hover:-translate-y-0.5"
              >
                Select
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
