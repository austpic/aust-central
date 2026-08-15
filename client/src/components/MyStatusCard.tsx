import { Calendar, ChevronDown } from 'lucide-react';
import type { DonorProfile } from '../models/bloodRequest';
import { formatShortDate } from '../models/bloodRequest';
import { BLOOD_GROUPS, sinceCopy } from '../utils/bloodEligibility';

// Mirrors MyStatusCard in lib/views/widgets/my_status_card.dart. Eligibility,
// progress, and status copy all come straight from the server (see
// BloodBankContext) — the 90-day rule is evaluated once in the API, not
// re-derived here, so it cannot drift between screens or clients.
export default function MyStatusCard({
  profile,
  onChanged,
  onPickBloodGroup,
  onPickDate,
}: {
  profile: DonorProfile;
  onChanged: (next: DonorProfile) => void;
  onPickBloodGroup: () => void;
  onPickDate: () => void;
}) {
  const { available, bloodGroup, lastDonated, eligible, progress: eligibilityProgress, statusCopy } = profile;
  const progressColor = eligible ? '#2f8f6a' : '#1b4332';

  return (
    <div className="glass glass-sheen rounded-[22px] p-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="font-display text-[17px] font-bold text-textdark">My Donor Status</div>
          <div className="mt-1 text-[12.5px] text-dim">
            {available ? 'You can be reached for donations' : 'You are not listed as a donor'}
          </div>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={available}
          onClick={() => onChanged({ ...profile, available: !available })}
          className={`h-7 w-[46px] shrink-0 rounded-full transition-colors ${
            available ? 'bg-primary/80' : 'bg-border/30'
          }`}
        >
          <span
            className={`glass block h-6 w-6 rounded-full transition-transform ${
              available ? 'translate-x-[21px]' : 'translate-x-0.5'
            }`}
            style={{
              backgroundColor: '#fff',
              boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.18), 0 1px 2px rgba(0,0,0,0.14)',
            }}
          />
        </button>
      </div>

      <div
        className={`mt-4 ${available ? '' : 'pointer-events-none opacity-50'}`}
      >
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onPickBloodGroup}
            className="glass-pill flex min-w-[84px] items-center gap-2 rounded-[14px] px-4 py-3"
          >
            <span
              className={`text-[14px] font-bold ${
                bloodGroup ? 'text-textdark' : 'text-subtlegrey'
              }`}
            >
              {bloodGroup ?? 'Set group'}
            </span>
            <ChevronDown size={18} className="text-textdark" />
          </button>
          <button
            type="button"
            onClick={available ? onPickDate : undefined}
            className="glass-input flex flex-1 items-center gap-2 rounded-[12px] px-4 py-3 text-left"
          >
            <Calendar size={18} />
            <span className="truncate text-[13px] font-semibold text-textdark">
              {lastDonated ? `Last donated: ${formatShortDate(lastDonated)}` : 'Set last donated'}
            </span>
          </button>
        </div>

        <div className="mt-3 flex items-center justify-between">
          <span className="text-[13px] font-semibold" style={{ color: progressColor }}>
            {statusCopy}
          </span>
          <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-dim">{sinceCopy(lastDonated)}</span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-lg bg-mintchip/50">
          <div
            className="h-full rounded-lg"
            style={{
              width: `${eligibilityProgress * 100}%`,
              backgroundColor: progressColor,
            }}
          />
        </div>
      </div>
    </div>
  );
}

export { BLOOD_GROUPS };
