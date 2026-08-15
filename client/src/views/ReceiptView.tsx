import { ArrowLeft, Bus, Clock, MapPin, Phone, Route } from 'lucide-react';
import { useReceiptViewModel } from '../viewmodels/useReceiptViewModel';

// Mirrors ReceiptPage in lib/screens/receipt_page.dart.
export default function ReceiptView() {
  const vm = useReceiptViewModel();

  return (
    <div className="mx-auto w-full max-w-2xl">
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
        <span className="ml-1 font-display text-[22px] font-bold tracking-tight text-textdark">Your Receipt</span>
      </div>

      <div className="glass-strong glass-sheen mt-4 overflow-hidden rounded-[24px]">
        {/* Header */}
        <div className="glass-accent rounded-t-[22px] px-6 py-5 text-center">
          <Bus size={36} className="mx-auto text-mint-ink" />
          <div className="mt-2 font-display text-[20px] font-bold text-mint-ink">{vm.busName}</div>
          <div className="eyebrow mt-2 text-mint-ink/80">Booking Confirmed</div>
        </div>

        {/* Dotted divider */}
        <div className="flex px-4 py-1">
          {Array.from({ length: 30 }).map((_, i) => (
            <div
              key={i}
              className="mx-0.5 h-[1.5px] flex-1"
              style={{ backgroundColor: i % 2 === 0 ? 'rgba(13,122,61,0.18)' : 'transparent' }}
            />
          ))}
        </div>

        {/* Details */}
        <div className="px-6 py-5">
          <ReceiptRow icon={<MapPin size={20} />} label="From" value={vm.fromLocation} />
          <div className="h-4" />
          <ReceiptRow icon={<MapPin size={20} />} label="To" value={vm.toLocation} />
          <div className="h-4" />
          <ReceiptRow icon={<Clock size={20} />} label="Time of Arrival" value={vm.selectedTime} />
          <div className="h-4" />
          <ReceiptRow icon={<Phone size={20} />} label="Driver Number" value={vm.driverNumber} />

          <div className="glass-tint mt-6 rounded-[14px] p-4">
            <div className="flex items-center gap-2">
              <Route size={18} className="text-mint-ink" />
              <span className="font-display text-[14px] font-bold text-mint-ink">Route</span>
            </div>
            <div className="mt-4 text-[14px] leading-[1.5] text-textdark">
              {vm.routeString}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="glass-tint rounded-b-[22px] py-3 text-center text-[13px] font-semibold text-mint-ink">
          Please be present timely at your location!
        </div>
      </div>
    </div>
  );
}

function ReceiptRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start">
      <span className="mt-0.5 text-mint-ink">{icon}</span>
      <div className="ml-3">
        <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.08em] text-dim">{label}</div>
        <div className="mt-0.5 text-[15px] font-semibold text-textdark">{value}</div>
      </div>
    </div>
  );
}
