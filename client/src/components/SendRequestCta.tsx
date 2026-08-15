import { Droplet, ArrowRight } from 'lucide-react';

// Mirrors _SendRequestCta in lib/screens/blood_bank_screen.dart
export default function SendRequestCta({ onTap }: { onTap: () => void }) {
  return (
    <button
      type="button"
      onClick={onTap}
      className="glass-accent glass-sheen flex w-full items-center gap-4 rounded-[22px] p-4 text-left transition-transform duration-200 hover:-translate-y-1 hover:brightness-105"
    >
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[14px] bg-white/20">
        <Droplet size={24} className="text-white" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[17px] font-bold text-white">Need blood?</div>
        <div className="text-[13px] leading-[1.3] text-white/90">
          Send a request to donors across campus
        </div>
      </div>
      <ArrowRight size={22} className="shrink-0 text-white" />
    </button>
  );
}
