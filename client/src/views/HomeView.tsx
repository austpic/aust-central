import {
  Bell,
  Calculator,
  BookOpen,
  ClipboardList,
  Boxes,
  Droplet,
  FileText,
  AlarmClock,
  ChevronRight,
  Megaphone,
  UserRound,
} from 'lucide-react';
import HeroTicket from '../components/HeroTicket';
import { useHomeViewModel } from '../viewmodels/useHomeViewModel';

// Mirrors HomePage in lib/screens/home_page.dart — greeting header, the
// to-do/reminder/transport trio, notice hero, and academic + community
// quick grids. Structure + flow unchanged; visuals follow v7 (hero ticket,
// mono section heads, 4-col quick tiles, class-card rows).
export default function HomeView() {
  const vm = useHomeViewModel();

  return (
    <div className="mx-auto w-full max-w-4xl">
      {/* Header — mono date line + gradient greeting + bell */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="eyebrow-rule">{vm.formattedDateTime}</div>
          <div className="mt-3 font-display text-[30px] font-bold leading-[1.1] tracking-tight text-gradient">
            Good {vm.greeting},
            <br />
            {vm.userLastName}
          </div>
        </div>
        <button
          type="button"
          onClick={vm.goToNotifications}
          aria-label="Notifications"
          className="glass relative flex h-12 w-12 items-center justify-center rounded-[14px] text-mint-ink transition-transform duration-200 hover:-translate-y-0.5"
        >
          <Bell size={22} />
          <span className="absolute right-3 top-3 h-[7px] w-[7px] rounded-full bg-coral shadow-[0_0_8px_2px_rgba(255,110,86,0.6)]" />
        </button>
      </div>

      {/* Hero ticket — notice board */}
      <div className="mt-6">
        <HeroTicket
          pillLabel="Live"
          live
          who="Notice board"
          title="Mid-term routine released"
          sub="Section B — full schedule is up on the Notice Board."
          footerIcon={<Megaphone size={14} />}
          footerText="View notice board"
          onTap={vm.goToNoticeBoard}
        />
      </div>

      {/* Rest of your day — class-card rows for the dashboard trio */}
      <div className="mt-6">
        <SectionHead label="Rest of your day" />
        <div className="mt-2 flex flex-col gap-3">
          <ClassRow
            badge="3 DUE"
            badgeTone="tag-mint"
            title="To-do List"
            sub="Keep the streak going"
            onTap={vm.goToTodo}
          />
          <ClassRow
            badge="02:30 PM"
            badgeTone="tag-sky"
            title="Class Reminder"
            sub="Next class, all set"
            onTap={vm.goToClassReminder}
          />
          <ClassRow
            badge="ROUTE"
            badgeTone="tag-gold"
            title="Transport"
            sub="Book your bus, see the route"
            onTap={vm.goToTransport}
          />
        </div>
      </div>

      {/* Academic quick grid */}
      <div className="mt-8">
        <SectionHead label="Academic" />
        <div className="mt-3 grid grid-cols-4 gap-3">
          <QuickTile icon={<Calculator size={26} />} tone="text-mint-ink" label="CGPA" onTap={vm.goToCgpa} />
          <QuickTile icon={<FileText size={26} />} tone="text-sky-ink" label="Lab Report" onTap={vm.goToLabReport} />
          <QuickTile icon={<ClipboardList size={26} />} tone="text-violet-ink" label="To-Do" onTap={vm.goToTodo} />
          <QuickTile icon={<AlarmClock size={26} />} tone="text-gold-ink" label="Reminders" onTap={vm.goToClassReminder} />
        </div>
      </div>

      {/* Community quick grid */}
      <div className="mt-6">
        <SectionHead label="Community" />
        <div className="mt-3 grid grid-cols-4 gap-3">
          <QuickTile icon={<Droplet size={26} />} tone="text-coral-ink" label="Blood Bank" onTap={vm.goToBloodBank} />
          <QuickTile icon={<BookOpen size={26} />} tone="text-gold-ink" label="Books" onTap={vm.goToBookExchange} />
          <QuickTile icon={<Boxes size={26} />} tone="text-sky-ink" label="Lost & Found" onTap={vm.goToLostFound} />
          <QuickTile icon={<UserRound size={26} />} tone="text-mint-ink" label="Profile" onTap={vm.goToProfile} />
        </div>
      </div>

      <div className="mt-8 flex justify-end">
        <ClipboardList size={20} className="text-dim2/40" />
      </div>
    </div>
  );
}

function SectionHead({ label }: { label: string }) {
  return <div className="font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-mint-ink">{label}</div>;
}

function ClassRow({
  badge,
  badgeTone,
  title,
  sub,
  onTap,
}: {
  badge: string;
  badgeTone: string;
  title: string;
  sub: string;
  onTap: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onTap}
      className="glass flex w-full items-center gap-3 rounded-[20px] px-4 py-3 text-left transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-glass-lg"
    >
      <span
        className={`${badgeTone} flex min-w-[54px] items-center justify-center rounded-[10px] px-2 py-2 text-center font-mono text-[11px] font-bold leading-tight`}
      >
        {badge}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-display text-[15px] font-bold text-textdark">{title}</span>
        <span className="block truncate text-[11.5px] text-dim">{sub}</span>
      </span>
      <ChevronRight size={18} className="shrink-0 text-dim2" />
    </button>
  );
}

function QuickTile({
  icon,
  tone,
  label,
  onTap,
}: {
  icon: React.ReactNode;
  tone: string;
  label: string;
  onTap: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onTap}
      className="flex flex-col items-center gap-2.5 transition-transform duration-200 hover:-translate-y-1"
    >
      <span className={`glass-tint flex h-16 w-16 items-center justify-center rounded-[20px] shadow-[inset_0_1px_0_rgba(255,255,255,0.5)] ${tone}`}>
        {icon}
      </span>
      <span className="text-center text-[12px] font-semibold leading-tight text-dim">{label}</span>
    </button>
  );
}
