import { Droplet, CalendarDays, Copy, Phone, Trash2, HeartHandshake } from 'lucide-react';
import type { BloodRequest } from '../models/bloodRequest';
import { requestInitials, formatShortDate, urgencyLabel } from '../models/bloodRequest';

const URGENCY_TONE: Record<BloodRequest['urgency'], string> = {
  routine: 'tag-mint',
  urgent: 'tag-gold',
  critical: 'tag-coral',
};

// Mirrors BloodRequestCard in lib/widgets/blood_request_card.dart
export default function BloodRequestCard({
  request,
  mine = false,
  onHelp,
  onCancel,
  onCopy,
}: {
  request: BloodRequest;
  mine?: boolean;
  onHelp?: () => void;
  onCancel?: () => void;
  onCopy: () => void;
}) {
  return (
    <div className="glass rounded-[20px] p-4 transition-shadow duration-200 hover:shadow-glass-lg">
      <div className="flex items-start">
        <div className="tag-coral flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-[14px] text-[16px] font-bold">
          {requestInitials(request.patientName)}
        </div>
        <div className="ml-4 min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <div className="truncate font-display text-[16px] font-bold text-textdark">
              {request.patientName}
            </div>
            <span className="tag-coral shrink-0 rounded-full px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.06em]">
              {request.bloodGroup}
            </span>
          </div>
          <div className="mt-1 truncate text-[13px] text-dim">
            {request.hospital} · {request.location}
          </div>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="glass-pill inline-flex items-center gap-2 rounded-full px-3 py-1 font-mono text-[10.5px] font-semibold uppercase tracking-[0.06em] text-dim">
          <Droplet size={14} className="text-mint-ink" />
          {request.units} unit{request.units === 1 ? '' : 's'}
        </span>
        <span className="glass-pill inline-flex items-center gap-2 rounded-full px-3 py-1 font-mono text-[10.5px] font-semibold uppercase tracking-[0.06em] text-dim">
          <CalendarDays size={14} className="text-mint-ink" />
          By {formatShortDate(request.requiredBy)}
        </span>
        <span
          className={`${URGENCY_TONE[request.urgency]} rounded-full px-3 py-1 font-mono text-[9.5px] font-bold uppercase tracking-[0.06em]`}
        >
          {urgencyLabel(request.urgency)}
        </span>
      </div>

      {request.notes && (
        <div className="glass-tint mt-3 rounded-[12px] p-4 text-[13px] leading-[1.35] text-textdark">
          {request.notes}
        </div>
      )}

      <div className="mt-4 flex gap-3">
        {mine ? (
          <>
            <button
              type="button"
              onClick={onCopy}
              className="glass-tint flex flex-1 items-center justify-center gap-2 rounded-[12px] py-3 text-[14px] font-semibold text-textdark hover:-translate-y-0.5"
            >
              <Copy size={18} />
              Copy contact
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="flex flex-1 items-center justify-center gap-2 rounded-[12px] border border-danger/40 py-3 text-[14px] font-semibold text-danger hover:-translate-y-0.5"
            >
              <Trash2 size={18} />
              Cancel
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={onCopy}
              className="glass-tint flex flex-1 items-center justify-center gap-2 rounded-[12px] py-3 text-[14px] font-semibold text-textdark hover:-translate-y-0.5"
            >
              <Phone size={18} />
              Contact
            </button>
            <button
              type="button"
              onClick={onHelp}
              className="glass-accent flex flex-1 items-center justify-center gap-2 rounded-[12px] py-3 text-[14px] font-semibold text-white hover:-translate-y-0.5"
            >
              <HeartHandshake size={18} />
              I can help
            </button>
          </>
        )}
      </div>
    </div>
  );
}
