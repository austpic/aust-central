import { ArrowLeft, MapPin, ChevronDown } from 'lucide-react';
import { useBusViewModel } from '../viewmodels/useBusViewModel';

// Mirrors BusPage + LocationCard in lib/screens/bus_page.dart.
export default function BusView() {
  const vm = useBusViewModel();

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

      {/* Route step */}
      <div className="eyebrow-rule mt-6">Choose Your Route</div>

      {/* Location card */}
      <div className="glass-accent glass-sheen mt-3 rounded-[20px] p-4">
        <div className="flex items-start">
          <div className="flex flex-col items-center">
            <MapPin size={24} className="text-white" />
            <div className="h-[100px] w-0.5 bg-white/50" />
            <MapPin size={24} className="text-white" />
          </div>
          <div className="ml-4 flex-1">
            <LocationDropdown
              label="From"
              value={vm.selectedFrom}
              places={vm.places}
              onSelect={vm.selectFrom}
            />
            <div className="h-4" />
            <LocationDropdown
              label="To"
              value={vm.selectedTo}
              places={vm.places}
              onSelect={vm.selectTo}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function LocationDropdown({
  label,
  value,
  places,
  onSelect,
}: {
  label: string;
  value?: string;
  places: string[];
  onSelect: (value: string) => void;
}) {
  return (
    <div>
      <div className="text-[13px] font-semibold text-white/80">{label}</div>
      <div className="mt-2 relative">
        <select
          value={value ?? ''}
          onChange={(e) => onSelect(e.target.value)}
          className="w-full appearance-none rounded-[30px] border border-white/30 bg-white/20 px-4 py-3 text-[14px] font-semibold text-white outline-none backdrop-blur-sm"
        >
          <option value="" disabled className="text-textdark">
            Select location
          </option>
          {places.map((p) => (
            <option key={p} value={p} className="text-textdark">
              {p}
            </option>
          ))}
        </select>
        <ChevronDown
          size={20}
          className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-white"
        />
      </div>
    </div>
  );
}
