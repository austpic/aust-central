import { ArrowLeft, MapPin, Phone } from 'lucide-react';
import { Dialog } from '../components/Modal';
import { useBusSelectionViewModel } from '../viewmodels/useBusSelectionViewModel';

// Mirrors BusSelectionPage in lib/screens/bus_selection_page.dart.
export default function BusSelectionView() {
  const vm = useBusSelectionViewModel();

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
      <div className="glass glass-sheen mt-4 rounded-[20px] p-4">
        <div className="flex items-center">
          <div className="flex flex-col items-center">
            <MapPin size={24} className="text-mint-ink" />
            <div className="h-10 w-0.5 bg-mint-ink/20" />
            <MapPin size={24} className="text-mint-ink" />
          </div>
          <div className="ml-3 flex-1">
            <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.08em] text-dim">From</div>
            <div className="glass-input mt-1 flex items-center rounded-[30px] border border-glass-border bg-white/60 px-4 py-3 text-[15px] font-semibold text-textdark">
              {vm.fromLocation}
            </div>
            <div className="mt-3 font-mono text-[10px] font-semibold uppercase tracking-[0.08em] text-dim">To</div>
            <div className="glass-input mt-1 flex items-center rounded-[30px] border border-glass-border bg-white/60 px-4 py-3 text-[15px] font-semibold text-textdark">
              {vm.toLocation}
            </div>
          </div>
        </div>
      </div>

      {/* Buses */}
      <div className="eyebrow-rule mt-6">Available Buses</div>

      <div className="mt-4">
        {vm.buses.map((bus, index) => (
          <div key={bus.name}>
            {index > 0 && <div className="h-px bg-glass-border" />}
            <div className="flex items-center py-3">
              <div className="glass-accent flex h-[100px] w-[110px] shrink-0 items-center justify-center rounded-[14px] text-center">
                <span className="px-2 font-display text-[14px] font-bold leading-[1.3] text-mint-ink">
                  {bus.name}
                </span>
              </div>
              <div className="ml-4 flex-1 space-y-2">
                <button
                  type="button"
                  onClick={() => vm.selectBus(bus)}
                  className="glass-accent w-full rounded-[30px] py-3 font-display text-[14px] font-bold text-mint-ink transition-transform duration-200 hover:-translate-y-0.5"
                >
                  Select
                </button>
                <button
                  type="button"
                  onClick={() => vm.setRouteDialog(bus)}
                  className="glass w-full rounded-[30px] py-3 text-[14px] font-bold text-mint-ink"
                >
                  Full Route
                </button>
                <button
                  type="button"
                  onClick={() => vm.setContactDialog(bus)}
                  className="glass w-full rounded-[30px] py-3 text-[14px] font-bold text-mint-ink"
                >
                  Contact
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Full route dialog */}
      {vm.routeDialog && (
        <Dialog title={vm.routeDialog.name} onClose={() => vm.setRouteDialog(null)}>
          <div className="text-[15px] leading-[1.5] text-textdark">
            {vm.routeDialog.route.join(' → ')}
          </div>
          <div className="mt-6 flex justify-end">
            <button
              type="button"
              onClick={() => vm.setRouteDialog(null)}
              className="rounded-full px-6 py-3 font-bold text-mint-ink"
            >
              Close
            </button>
          </div>
        </Dialog>
      )}

      {/* Driver contact dialog */}
      {vm.contactDialog && (
        <Dialog title="Driver Contact" onClose={() => vm.setContactDialog(null)}>
          <div className="flex items-center gap-3">
            <div className="glass-tint flex h-11 w-11 items-center justify-center rounded-[12px] shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]">
              <Phone size={20} className="text-mint-ink" />
            </div>
            <div>
              <div className="text-[15px] font-bold text-textdark">
                {vm.contactDialog.name}
              </div>
              <div className="text-[14px] text-dim">
                {vm.contactDialog.driverNumber}
              </div>
            </div>
          </div>
          <div className="mt-6 flex justify-end">
            <button
              type="button"
              onClick={() => vm.setContactDialog(null)}
              className="rounded-full px-6 py-3 font-bold text-mint-ink"
            >
              Close
            </button>
          </div>
        </Dialog>
      )}
    </div>
  );
}
