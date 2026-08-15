import { ArrowLeft, User, Hospital, MapPin, Droplets, Phone, StickyNote } from 'lucide-react';
import Field from '../components/Field';
import { useBloodRequestFormViewModel } from '../viewmodels/useBloodRequestFormViewModel';
import { formatShortDate } from '../models/bloodRequest';

// Mirrors BloodRequestFormScreen in lib/screens/blood_request_form_screen.dart.
export default function BloodRequestFormView() {
  const vm = useBloodRequestFormViewModel();

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
        <span className="ml-1 font-display text-[20px] font-bold tracking-tight text-textdark">Send Blood Request</span>
      </div>

      <div className="mt-4">
        <Section title="Patient">
          <Field
            label="Patient name"
            value={vm.name}
            onChange={(e) => vm.setName(e.target.value)}
            icon={<User size={20} className="text-dim" />}
          />
        </Section>

        <Section title="Required blood">
          <div className="flex flex-wrap gap-2">
            {vm.bloodGroups.map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => vm.setBloodGroup(g)}
                className={`rounded-full px-4 py-2 text-[13px] font-semibold transition-transform duration-200 hover:-translate-y-0.5 ${
                  vm.bloodGroup === g
                    ? 'glass-pill-active'
                    : 'glass-pill text-textdark'
                }`}
              >
                {g}
              </button>
            ))}
          </div>
          {vm.bloodGroup === null && (
            <div className="mt-2 pl-1 text-xs text-danger/90">Pick a blood group</div>
          )}
        </Section>

        <Section title="Where">
          <Field
            label="Hospital / Center"
            value={vm.hospital}
            onChange={(e) => vm.setHospital(e.target.value)}
            icon={<Hospital size={20} className="text-dim" />}
          />
          <div className="h-3" />
          <Field
            label="Location (optional)"
            value={vm.location}
            onChange={(e) => vm.setLocation(e.target.value)}
            icon={<MapPin size={20} className="text-dim" />}
          />
        </Section>

        <Section title="Details">
          <div className="flex gap-3">
            <Field
              label="Units"
              value={vm.units}
              onChange={(e) => vm.setUnits(e.target.value.replace(/\D/g, '').slice(0, 2))}
              icon={<Droplets size={20} className="text-dim" />}
            />
            <label className="glass-input flex-1 cursor-pointer rounded-[14px] px-3 py-3">
              <div className="text-[13px] text-dim">
                {vm.requiredBy ? formatShortDate(vm.requiredBy) : 'Required by'}
              </div>
              <input
                type="date"
                className="w-full bg-transparent py-1 text-[14px] text-textdark outline-none"
                onChange={(e) => {
                  if (e.target.value) vm.pickRequiredBy(new Date(e.target.value));
                }}
              />
            </label>
          </div>
          {vm.requiredByError && (
            <div className="mt-2 pl-1 text-xs text-danger/90">Pick a required-by date.</div>
          )}
          <div className="mt-4 font-mono text-[10px] font-semibold uppercase tracking-[0.08em] text-dim">Urgency</div>
          <div className="mt-2 flex flex-wrap gap-2">
            {vm.urgencies.map((u) => (
              <button
                key={u.name}
                type="button"
                onClick={() => vm.setUrgency(u.name)}
                className={`rounded-full px-4 py-2 text-[13px] font-semibold transition-transform duration-200 hover:-translate-y-0.5 ${
                  vm.urgency === u.name
                    ? 'glass-pill-active'
                    : 'glass-pill text-textdark'
                }`}
              >
                {u.label}
              </button>
            ))}
          </div>
        </Section>

        <Section title="Contact">
          <Field
            label="Contact number"
            value={vm.contact}
            onChange={(e) => vm.setContact(e.target.value)}
            icon={<Phone size={20} className="text-dim" />}
            type="tel"
          />
        </Section>

        <Section title="Notes">
          <Field
            label="Anything else (optional)"
            value={vm.notes}
            onChange={(e) => vm.setNotes(e.target.value)}
            icon={<StickyNote size={20} className="text-dim" />}
            textarea
            rows={2}
          />
        </Section>

        <button
          type="button"
          onClick={vm.submit}
          className="glass-accent glass-sheen mt-4 h-[54px] w-full rounded-[14px] text-[16px] font-bold text-white transition-transform duration-200 hover:-translate-y-0.5"
        >
          Send Request
        </button>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-6">
      <div className="eyebrow-rule mb-3 pl-1">{title}</div>
      {children}
    </div>
  );
}
