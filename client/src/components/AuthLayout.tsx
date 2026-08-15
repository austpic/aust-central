import type { ReactNode } from 'react';
import { Check } from 'lucide-react';
import AmbientBackground from './AmbientBackground';
import appLogo from '../assets/app-logo.png';

// Split-screen auth shell used by Login + Register. On desktop (>= lg) the
// left half is a decorative brand panel (teal gradient + abstract shapes +
// tagline + feature highlights); on mobile it collapses to a compact banner
// above the form. Only the form column is supplied by the child view — the
// auth logic stays in each view's ViewModel, this is purely presentational.
export default function AuthLayout({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <div className="relative flex min-h-svh flex-col">
      <AmbientBackground />
      <div className="relative z-10 grid min-h-svh lg:grid-cols-2">
        <DecorativePanel />
        <MobileBanner />
        <div className="flex flex-col justify-center px-6 py-10 sm:px-12 lg:px-16 lg:py-16">
          <div className="mx-auto w-full max-w-md">
            <h1 className="font-display text-[32px] font-bold leading-[1.1] tracking-tight text-textdark">
              {title}
            </h1>
            <p className="mt-2 text-[14px] leading-relaxed text-dim">{subtitle}</p>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

function MobileBanner() {
  return (
    <div className="relative overflow-hidden lg:hidden">
      <div
        className="absolute inset-0"
        style={{ background: 'linear-gradient(150deg,#2f8f6a 0%,#1b4332 100%)' }}
      />
      <svg
        viewBox="0 0 400 240"
        preserveAspectRatio="none"
        className="pointer-events-none absolute inset-0 h-full w-full"
        aria-hidden="true"
      >
        <circle cx="360" cy="30" r="140" fill="rgba(255,255,255,0.09)" />
        <circle cx="20" cy="220" r="150" fill="rgba(255,255,255,0.07)" />
        <path
          d="M0 190 Q120 150 240 200 T400 170 L400 240 L0 240 Z"
          fill="rgba(255,255,255,0.08)"
        />
      </svg>
      <div className="relative z-10 px-6 pb-9 pt-6">
        <div className="flex items-center gap-3">
          <span className="glass-strong flex h-11 w-11 items-center justify-center rounded-2xl">
            <img src={appLogo} alt="" className="h-8 w-8" />
          </span>
          <div className="leading-tight">
            <div className="font-display text-[17px] font-bold text-white">AUST Central</div>
            <div className="mt-0.5 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-white/70">
              Student Portal
            </div>
          </div>
        </div>
        <h2 className="mt-5 max-w-xs font-display text-[26px] font-bold leading-[1.15] tracking-tight text-white">
          Everything AUST, in one place.
        </h2>
      </div>
    </div>
  );
}

const HIGHLIGHTS = [
  'Campus bus schedules, at your fingertips',
  'CGPA, class reminders & lab-report tools',
  'Blood bank, book exchange & lost & found',
];

function DecorativePanel() {
  return (
    <div className="relative hidden overflow-hidden lg:flex lg:flex-col lg:justify-between lg:p-12 lg:pb-14 lg:pr-14 lg:pt-10">
      <div
        className="absolute inset-0"
        style={{ background: 'linear-gradient(150deg,#2f8f6a 0%,#1b4332 100%)' }}
      />
      <svg
        viewBox="0 0 800 800"
        preserveAspectRatio="none"
        className="pointer-events-none absolute inset-0 h-full w-full"
        aria-hidden="true"
      >
        <circle cx="690" cy="90" r="240" fill="rgba(255,255,255,0.08)" />
        <circle cx="90" cy="660" r="280" fill="rgba(255,255,255,0.07)" />
        <circle cx="620" cy="600" r="180" fill="rgba(255,255,255,0.09)" />
        <circle cx="180" cy="180" r="120" fill="rgba(255,255,255,0.05)" />
        <path
          d="M0 640 Q160 560 320 620 T800 580 L800 800 L0 800 Z"
          fill="rgba(255,255,255,0.06)"
        />
      </svg>

      <div className="relative z-10 flex items-center gap-3">
        <span className="glass-strong flex h-11 w-11 items-center justify-center rounded-2xl">
          <img src={appLogo} alt="" className="h-8 w-8" />
        </span>
        <div className="leading-tight">
          <div className="font-display text-[18px] font-bold text-white">AUST Central</div>
          <div className="mt-0.5 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-white/70">
            Student Portal
          </div>
        </div>
      </div>

      <div className="relative z-10">
        <h2 className="max-w-md font-display text-[38px] font-bold leading-[1.12] tracking-tight text-white">
          Everything AUST, in one place.
        </h2>
        <p className="mt-5 max-w-sm text-[15px] leading-relaxed text-white/80">
          Buses, classes, CGPA, notices, and the student community — bundled into one app
          built for Ahsanullah University of Science &amp; Technology.
        </p>
      </div>

      <ul className="relative z-10 space-y-3">
        {HIGHLIGHTS.map((h) => (
          <li key={h} className="flex items-center gap-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] bg-white/15 text-white">
              <Check size={16} strokeWidth={2.5} />
            </span>
            <span className="text-[14px] font-medium text-white/90">{h}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
