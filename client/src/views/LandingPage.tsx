import { Link } from 'react-router-dom';
import {
  AlarmClock,
  ArrowRight,
  Bell,
  BookOpen,
  Boxes,
  Bus,
  Calculator,
  Check,
  ClipboardList,
  Droplet,
  FileText,
  Home,
  MapPin,
  Megaphone,
  type LucideIcon,
} from 'lucide-react';
import AmbientBackground from '../components/AmbientBackground';
import appLogo from '../assets/app-logo.png';
import { useAuth } from '../viewmodels/AuthContext';

// Public marketing/landing page — first thing anyone sees, no login needed.
// Fully separate from the app shell: its own header + footer, scroll-linked
// sections, and genuine copy derived from the Flutter app's real features
// (lib/views/home/home_page.dart + the screens it links to).
export default function LandingPage() {
  const { isSignedIn: loggedIn } = useAuth();

  return (
    <div className="relative min-h-svh">
      <AmbientBackground />
      <div className="relative z-10">
        <LandingHeader loggedIn={loggedIn} />
        <main>
          <HeroSection loggedIn={loggedIn} />
          <FeaturesSection />
          <AboutSection />
        </main>
        <LandingFooter />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Header                                                              */
/* ------------------------------------------------------------------ */

function scrollToId(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function LandingHeader({ loggedIn }: { loggedIn: boolean }) {
  return (
    <header className="sticky top-0 z-40 border-b border-glass-border bg-white/60 backdrop-blur-2xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <span className="glass-tint flex h-10 w-10 items-center justify-center rounded-xl">
            <img src={appLogo} alt="" className="h-7 w-7" />
          </span>
          <div className="leading-tight">
            <div className="font-display text-[16px] font-bold text-textdark">AUST Central</div>
            <div className="eyebrow mt-0.5">Student Portal</div>
          </div>
        </div>

        <nav className="hidden items-center gap-1 md:flex">
          {[
            { label: 'Features', id: 'features' },
            { label: 'About', id: 'about' },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => scrollToId(item.id)}
              className="rounded-full px-4 py-2 text-[14px] font-semibold text-textdark hover:glass-tint"
            >
              {item.label}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          {loggedIn ? (
            <Link
              to="/home"
              className="glass-accent glass-sheen inline-flex items-center gap-1.5 rounded-full px-5 py-2 text-[14px] font-semibold text-white"
            >
              <Home size={16} />
              Home
            </Link>
          ) : (
            <>
              <Link
                to="/login"
                className="hidden rounded-full border border-mint-ink/30 px-5 py-2 text-[14px] font-semibold text-mint-ink transition-colors hover:border-mint-ink hover:bg-mint/10 sm:inline-flex"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="glass-accent glass-sheen inline-flex items-center gap-1.5 rounded-full px-5 py-2 text-[14px] font-semibold text-white"
              >
                Get Started
                <ArrowRight size={16} />
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

/* ------------------------------------------------------------------ */
/* Hero                                                                */
/* ------------------------------------------------------------------ */

function HeroSection({ loggedIn }: { loggedIn: boolean }) {
  return (
    <section className="relative overflow-hidden">
      <div className="mx-auto grid max-w-7xl items-center gap-14 px-6 pb-20 pt-16 sm:pt-20 lg:grid-cols-[1.05fr_1fr] lg:gap-10 lg:px-8 lg:pb-28 lg:pt-24">
        <div>
          <div className="eyebrow-rule">AUST Student Portal</div>
          <h1 className="mt-5 font-display text-[40px] font-bold leading-[1.05] tracking-tight text-gradient sm:text-[56px]">
            Everything AUST,
            <br />
            in one place.
          </h1>
          <p className="mt-6 max-w-xl text-[16px] leading-relaxed text-dim sm:text-[17px]">
            Check your campus bus schedule, keep track of classes and to-dos, calculate your
            CGPA, and tap into the student community — blood bank, book exchange and lost &amp;
            found. All in one platform built for Ahsanullah University of Science &amp;
            Technology.
          </p>

          <div className="mt-9 flex flex-wrap items-center gap-4">
            {loggedIn ? (
              <Link
                to="/home"
                className="glass-accent glass-sheen inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-[16px] font-semibold text-white"
              >
                <Home size={18} />
                Go to Home
              </Link>
            ) : (
              <>
                <Link
                  to="/register"
                  className="glass-accent glass-sheen inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-[16px] font-semibold text-white"
                >
                  Get Started
                  <ArrowRight size={18} />
                </Link>
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 rounded-full border border-mint-ink/30 px-7 py-3.5 text-[16px] font-semibold text-mint-ink transition-colors hover:border-mint-ink hover:bg-mint/10"
                >
                  Sign In
                </Link>
              </>
            )}
          </div>

          <p className="mt-6 font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-dim2">
            Free for AUST students · Built by students, for students
          </p>
        </div>

        <PhoneMockup />
      </div>
    </section>
  );
}

function PhoneMockup() {
  return (
    <div className="relative mx-auto w-full max-w-[340px]">
      {/* Glow behind the phone */}
      <div
        className="absolute inset-0 -z-10 rounded-full opacity-70 blur-3xl"
        style={{ background: 'radial-gradient(circle at 50% 40%, rgba(43,201,122,0.35), transparent 65%)' }}
      />
      {/* Floating chips */}
      <div className="glass-strong absolute -left-10 top-16 z-20 hidden items-center gap-2.5 rounded-2xl px-4 py-3 sm:flex">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-mint/20 text-mint-ink">
          <Bus size={17} />
        </span>
        <div className="leading-tight">
          <div className="text-[12px] font-bold text-textdark">Bus schedule</div>
          <div className="text-[10.5px] text-dim">Uttara → AUST · 08:15</div>
        </div>
      </div>
      <div className="glass-strong absolute -right-9 bottom-24 z-20 hidden items-center gap-2.5 rounded-2xl px-4 py-3 sm:flex">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gold/20 text-gold-ink">
          <Calculator size={17} />
        </span>
        <div className="leading-tight">
          <div className="text-[12px] font-bold text-textdark">CGPA 3.72</div>
          <div className="text-[10.5px] text-dim">Current semester</div>
        </div>
      </div>

      {/* Phone frame */}
      <div className="glass-strong relative z-10 rounded-[36px] border border-glass-border bg-white/70 p-3 shadow-glass-lg">
        <div className="overflow-hidden rounded-[26px] bg-scaffold">
          {/* Status bar */}
          <div className="flex items-center justify-between px-5 pb-1 pt-3">
            <span className="font-mono text-[10px] font-semibold text-textdark">9:41</span>
            <div className="flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-textdark/60" />
              <span className="h-1.5 w-1.5 rounded-full bg-textdark/60" />
              <span className="h-1.5 w-1.5 rounded-full bg-textdark/60" />
            </div>
          </div>

          {/* App header */}
          <div className="flex items-center justify-between px-5 pt-3">
            <div className="flex items-center gap-2">
              <span className="glass-tint flex h-7 w-7 items-center justify-center rounded-lg">
                <img src={appLogo} alt="" className="h-5 w-5" />
              </span>
              <span className="font-display text-[13px] font-bold text-textdark">AUST Central</span>
            </div>
            <span className="relative flex h-8 w-8 items-center justify-center rounded-[10px] bg-white text-mint-ink shadow-soft">
              <Bell size={15} />
              <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-coral" />
            </span>
          </div>

          {/* Greeting */}
          <div className="px-5 pt-4">
            <div className="font-mono text-[8px] font-semibold uppercase tracking-[0.14em] text-mint-ink">
              Tuesday, 09:41 am
            </div>
            <div className="mt-1 font-display text-[17px] font-bold text-gradient">
              Good Morning, Farhana
            </div>
          </div>

          {/* Notice ticket */}
          <div className="px-5 pt-3">
            <div className="glass rounded-[16px] p-3.5">
              <div className="flex items-center gap-2 font-mono text-[8px] font-bold uppercase tracking-[0.1em] text-mint-ink">
                <span className="live-dot" />
                Live
                <span className="ml-auto text-dim">Notice board</span>
              </div>
              <div className="mt-1.5 font-display text-[12.5px] font-bold text-textdark">
                Mid-term routine released
              </div>
              <div className="mt-0.5 text-[10px] text-dim">Section B — full schedule is up.</div>
            </div>
          </div>

          {/* Quick tiles */}
          <div className="px-5 pt-4">
            <div className="font-mono text-[8px] font-bold uppercase tracking-[0.14em] text-mint-ink">
              Quick access
            </div>
            <div className="mt-2 grid grid-cols-4 gap-2">
              <MiniTile tone="text-mint-ink" icon={<Bus size={16} />} label="Bus" />
              <MiniTile tone="text-gold-ink" icon={<Calculator size={16} />} label="CGPA" />
              <MiniTile tone="text-coral-ink" icon={<Droplet size={16} />} label="Blood" />
              <MiniTile tone="text-sky-ink" icon={<BookOpen size={16} />} label="Books" />
            </div>
          </div>

          {/* Transport row */}
          <div className="px-5 pb-6 pt-4">
            <div className="glass-accent glass-sheen flex items-center gap-3 rounded-[16px] p-3.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/20 text-white">
                <MapPin size={17} />
              </span>
              <div className="leading-tight">
                <div className="font-display text-[12px] font-bold text-white">Transport</div>
                <div className="text-[10px] text-white/70">Choose your route → check the schedule</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MiniTile({
  icon,
  tone,
  label,
}: {
  icon: React.ReactNode;
  tone: string;
  label: string;
}) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <span className={`glass-tint flex h-9 w-9 items-center justify-center rounded-[11px] ${tone}`}>
        {icon}
      </span>
      <span className="text-[8.5px] font-semibold text-dim">{label}</span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Features                                                            */
/* ------------------------------------------------------------------ */

type Feature = {
  icon: LucideIcon;
  title: string;
  description: string;
  tone: string;
};

const FEATURES: Feature[] = [
  {
    icon: Bus,
    title: 'Transport Tracking',
    description:
      'Pick a route and time, check the campus bus schedule, and plan your commute with ease.',
    tone: 'tag-mint',
  },
  {
    icon: AlarmClock,
    title: 'Class Schedule',
    description:
      'See when your next class starts and set reminders so you never walk in late again.',
    tone: 'tag-sky',
  },
  {
    icon: ClipboardList,
    title: 'To-do List & Notes',
    description:
      'Plan your day with a simple task list — assignments, quick notes, and everything in between.',
    tone: 'tag-gold',
  },
  {
    icon: Megaphone,
    title: 'Notice Board',
    description:
      'Official academic notices, exam routines, and campus announcements in one scrolling feed.',
    tone: 'tag-violet',
  },
  {
    icon: Calculator,
    title: 'CGPA Calculator',
    description:
      'Compute your CGPA, run what-if scenarios, and follow your history across semesters.',
    tone: 'tag-mint',
  },
  {
    icon: FileText,
    title: 'Lab Report Cover',
    description:
      'Generate a clean, formatted cover page for your lab reports in seconds.',
    tone: 'tag-sky',
  },
  {
    icon: Droplet,
    title: 'Blood Bank',
    description:
      'Request blood, list yourself as a donor, and help someone on campus when it matters most.',
    tone: 'tag-coral',
  },
  {
    icon: BookOpen,
    title: 'Book Exchange',
    description:
      'List used books, chat with buyers, and grab semester essentials at student prices.',
    tone: 'tag-gold',
  },
  {
    icon: Boxes,
    title: 'Lost & Found',
    description:
      'Post what you lost or found around campus and help the AUST community reconnect.',
    tone: 'tag-violet',
  },
];

function FeaturesSection() {
  return (
    <section id="features" className="scroll-mt-20 bg-white/45 py-20 backdrop-blur-sm lg:py-24">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <div className="eyebrow-rule justify-center">Features</div>
          <h2 className="mt-4 font-display text-[34px] font-bold leading-tight tracking-tight text-textdark sm:text-[40px]">
            One platform. Everything campus.
          </h2>
          <p className="mt-4 text-[15px] leading-relaxed text-dim">
            Every tool you need for a smoother day at AUST — built around how students
            actually live their day, from the morning commute to exam season.
          </p>
        </div>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="glass group flex flex-col rounded-[20px] p-6 transition-transform duration-200 hover:-translate-y-1 hover:shadow-glass-lg"
            >
              <span
                className={`${f.tone} flex h-12 w-12 items-center justify-center rounded-[14px] transition-transform duration-200 group-hover:scale-105`}
              >
                <f.icon size={22} strokeWidth={2} />
              </span>
              <h3 className="mt-4 font-display text-[17px] font-bold text-textdark">{f.title}</h3>
              <p className="mt-1.5 text-[13.5px] leading-relaxed text-dim">{f.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* About / why-us                                                      */
/* ------------------------------------------------------------------ */

const ABOUT_HIGHLIGHTS = [
  'Designed for AUST students — real routes, real routines',
  'Campus services in one app: no juggling between tools',
  'Community-first: blood bank, book exchange, lost & found',
  'Free to use, and always getting better',
];

function AboutSection() {
  return (
    <section id="about" className="scroll-mt-20 py-20 lg:py-28">
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-6 lg:grid-cols-2 lg:gap-16 lg:px-8">
        <div>
          <div className="eyebrow-rule">Why AUST Central</div>
          <h2 className="mt-4 font-display text-[34px] font-bold leading-tight tracking-tight text-textdark sm:text-[40px]">
            Built for the way AUST students actually live their day.
          </h2>
          <p className="mt-5 text-[15.5px] leading-relaxed text-dim">
            Campus life is already busy enough. AUST Central brings your commute, classes,
            academics, and community together so you don't have to chase them across a dozen
            apps and noticeboards. Everything is free, student-first, and shaped around
            Ahsanullah University of Science &amp; Technology — available on web and mobile.
          </p>
          <ul className="mt-7 space-y-3.5">
            {ABOUT_HIGHLIGHTS.map((h) => (
              <li key={h} className="flex items-start gap-3">
                <span className="glass-tint mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-[8px] text-mint-ink">
                  <Check size={14} strokeWidth={3} />
                </span>
                <span className="text-[14.5px] leading-relaxed text-textdark">{h}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="relative">
          <div
            className="absolute inset-0 -z-10 rounded-full opacity-60 blur-3xl"
            style={{ background: 'radial-gradient(circle at 30% 30%, rgba(87,199,236,0.22), transparent 60%)' }}
          />
          <div className="glass glass-sheen rounded-[24px] p-8 shadow-glass-lg">
            <div className="font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-mint-ink">
              The AUST Central promise
            </div>
            <blockquote className="mt-4 font-display text-[22px] font-bold leading-snug text-textdark">
              &ldquo;From checking the morning bus schedule to tracking your CGPA, your whole
              campus day lives in one place.&rdquo;
            </blockquote>
            <div className="mt-6 h-px bg-glass-border" />
            <div className="mt-6 flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#407362]/15 font-display text-[16px] font-bold text-[#2c5c4f]">
                A
              </span>
              <div className="leading-tight">
                <div className="text-[13.5px] font-bold text-textdark">AUST Central Team</div>
                <div className="text-[12px] text-dim">Students, for students</div>
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            {['10+ campus tools', '100% free', 'Made for AUST'].map((stat) => (
              <span
                key={stat}
                className="glass-pill px-4 py-2 font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-mint-ink"
              >
                {stat}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Footer                                                              */
/* ------------------------------------------------------------------ */

function LandingFooter() {
  return (
    <footer className="border-t border-glass-border bg-white/50 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl flex-col gap-8 px-6 py-12 sm:flex-row sm:items-start sm:justify-between lg:px-8">
        <div className="max-w-xs">
          <div className="flex items-center gap-3">
            <span className="glass-tint flex h-9 w-9 items-center justify-center rounded-xl">
              <img src={appLogo} alt="" className="h-6 w-6" />
            </span>
            <div className="leading-tight">
              <div className="font-display text-[15px] font-bold text-textdark">AUST Central</div>
              <div className="eyebrow mt-0.5">Student Portal</div>
            </div>
          </div>
          <p className="mt-4 text-[13px] leading-relaxed text-dim">
            One platform for buses, classes, academics, and the AUST community.
          </p>
        </div>

        <div className="flex gap-14">
          <div>
            <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-dim2">
              Explore
            </div>
            <ul className="mt-3 space-y-2.5 text-[14px] font-semibold text-textdark">
              <li>
                <button type="button" onClick={() => scrollToId('features')} className="hover:text-mint-ink">
                  Features
                </button>
              </li>
              <li>
                <button type="button" onClick={() => scrollToId('about')} className="hover:text-mint-ink">
                  About
                </button>
              </li>
            </ul>
          </div>
          <div>
            <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-dim2">
              Contact
            </div>
            <ul className="mt-3 space-y-2.5 text-[14px] font-semibold text-textdark">
              <li>
                <a href="mailto:hello@austcentral.app" className="hover:text-mint-ink">
                  Email us
                </a>
              </li>
              <li>
                <a href="#" onClick={(e) => e.preventDefault()} className="hover:text-mint-ink">
                  AUST Campus
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>
      <div className="border-t border-glass-border">
        <div className="mx-auto max-w-7xl px-6 py-5 text-center text-[12px] text-dim2 lg:px-8">
          © {new Date().getFullYear()} AUST Central. Made for the AUST community.
        </div>
      </div>
    </footer>
  );
}
