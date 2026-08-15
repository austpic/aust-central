import { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  AlarmClock,
  Bell,
  BookOpen,
  Boxes,
  Bus,
  Calculator,
  ChevronDown,
  ClipboardList,
  Droplet,
  FileText,
  Home,
  LogOut,
  Megaphone,
  Menu,
  Settings,
  UserRound,
  X,
  type LucideIcon,
} from 'lucide-react';
import appLogo from '../assets/app-logo.png';
import { useProfileViewModel } from '../viewmodels/useProfileViewModel';
import { useToast } from './Toast';
import { useAuth } from '../viewmodels/AuthContext';

// Replaces the old left Sidebar: a single top bar used at every screen size.
// Primary sections sit as direct links; the less-primary tools group under an
// "Explore" dropdown. The avatar on the right opens the profile menu, and on
// small screens a hamburger reveals the same destinations in a drop-down panel.
type NavItem = { to: string; label: string; icon: LucideIcon };

const PRIMARY_NAV: NavItem[] = [
  { to: '/home', label: 'Home', icon: Home },
  { to: '/transport', label: 'Transport', icon: Bus },
  { to: '/notifications', label: 'Notifications', icon: Bell },
];

const EXPLORE_NAV: NavItem[] = [
  { to: '/todo', label: 'To-do List', icon: ClipboardList },
  { to: '/class-reminder', label: 'Class Reminder', icon: AlarmClock },
  { to: '/notice-board', label: 'Notice Board', icon: Megaphone },
  { to: '/cgpa', label: 'CGPA Calculator', icon: Calculator },
  { to: '/lab-report', label: 'Lab Report', icon: FileText },
  { to: '/blood-bank', label: 'Blood Bank', icon: Droplet },
  { to: '/book-exchange', label: 'Book Exchange', icon: BookOpen },
  { to: '/lost-found', label: 'Lost & Found', icon: Boxes },
];

export default function TopNav() {
  const navigate = useNavigate();
  const toast = useToast();
  const { pathname } = useLocation();
  const { user, initial } = useProfileViewModel();
  const { signOut: endSession } = useAuth();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [exploreOpen, setExploreOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const exploreActive = EXPLORE_NAV.some(
    (item) => pathname === item.to || pathname.startsWith(item.to + '/'),
  );

  function closeAll() {
    setMobileOpen(false);
    setExploreOpen(false);
    setProfileOpen(false);
  }

  function go(to: string) {
    closeAll();
    navigate(to);
  }

  async function signOut() {
    closeAll();
    await endSession();
    navigate('/login', { replace: true });
  }

  return (
    <>
    <header className="sticky top-0 z-40 border-b border-glass-border bg-white/60 backdrop-blur-2xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:px-6 lg:px-8">
        {/* Logo — opens the public landing page (shows signed-in state there) */}
        <button type="button" onClick={() => go('/')} className="flex items-center gap-2.5">
          <span className="glass-tint flex h-9 w-9 items-center justify-center rounded-xl">
            <img src={appLogo} alt="" className="h-6 w-6" />
          </span>
          <span className="hidden leading-tight sm:block">
            <span className="block font-display text-[15px] font-bold text-textdark">AUST Central</span>
            <span className="eyebrow mt-0.5">Student Portal</span>
          </span>
        </button>

        {/* Desktop nav */}
        <nav className="ml-4 hidden items-center gap-1 lg:flex">
          {PRIMARY_NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                [
                  'flex items-center gap-2 rounded-full px-4 py-2 text-[13.5px] font-semibold transition-colors',
                  isActive ? 'glass-pill-active' : 'text-textdark hover:glass-tint',
                ].join(' ')
              }
            >
              <item.icon size={17} />
              {item.label}
            </NavLink>
          ))}

          {/* Explore dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setExploreOpen((v) => !v);
                setProfileOpen(false);
              }}
              className={[
                'flex items-center gap-2 rounded-full px-4 py-2 text-[13.5px] font-semibold transition-colors',
                exploreActive || exploreOpen ? 'glass-pill-active' : 'text-textdark hover:glass-tint',
              ].join(' ')}
            >
              <Boxes size={17} />
              Explore
              <ChevronDown
                size={15}
                className={`transition-transform duration-200 ${exploreOpen ? 'rotate-180' : ''}`}
              />
            </button>

            {exploreOpen && (
              <div className="absolute left-0 top-full mt-2 w-[280px] rounded-2xl border border-glass-border bg-white p-2 shadow-glass-lg">
                <div className="eyebrow px-3 pb-1 pt-2">Explore</div>
                <div className="grid grid-cols-1 gap-0.5">
                  {EXPLORE_NAV.map((item) => (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      onClick={closeAll}
                      className={({ isActive }) =>
                        [
                          'flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-semibold',
                          isActive ? 'glass-pill-active' : 'text-textdark hover:glass-tint',
                        ].join(' ')
                      }
                    >
                      <item.icon size={17} />
                      {item.label}
                    </NavLink>
                  ))}
                </div>
              </div>
            )}
          </div>
        </nav>

        <div className="ml-auto flex items-center gap-2">
          {/* Mobile menu toggle */}
          <button
            type="button"
            onClick={() => {
              setMobileOpen((v) => !v);
              setProfileOpen(false);
              setExploreOpen(false);
            }}
            aria-label="Toggle menu"
            className="glass flex h-10 w-10 items-center justify-center rounded-[12px] text-textdark lg:hidden"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          {/* Profile dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setProfileOpen((v) => !v);
                setExploreOpen(false);
              }}
              aria-label="Profile menu"
              className="flex items-center gap-2 rounded-full p-1 transition-colors hover:glass-tint"
            >
              <span className="glass-tint flex h-10 w-10 items-center justify-center rounded-full font-display text-[16px] font-bold text-mint-ink">
                {initial}
              </span>
              <span className="hidden text-[13px] font-semibold text-textdark xl:block">
                {user.name.split(' ')[0]}
              </span>
              <ChevronDown
                size={15}
                className={`hidden text-dim transition-transform duration-200 xl:block ${profileOpen ? 'rotate-180' : ''}`}
              />
            </button>

            {profileOpen && (
              <div className="absolute right-0 top-full mt-2 w-64 rounded-2xl border border-glass-border bg-white p-2 shadow-glass-lg">
                <div className="border-b border-glass-border px-3 pb-3 pt-2">
                  <div className="font-display text-[14px] font-bold text-textdark">{user.name}</div>
                  <div className="mt-0.5 text-[12px] text-dim">{user.email}</div>
                </div>
                <div className="pt-1.5">
                  <button
                    type="button"
                    onClick={() => go('/profile')}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[13px] font-semibold text-textdark hover:glass-tint"
                  >
                    <UserRound size={17} className="text-mint-ink" />
                    Profile
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setProfileOpen(false);
                      toast('Settings are coming soon.');
                    }}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[13px] font-semibold text-textdark hover:glass-tint"
                  >
                    <Settings size={17} className="text-mint-ink" />
                    Settings
                  </button>
                  <button
                    type="button"
                    onClick={signOut}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[13px] font-semibold text-coral-ink hover:bg-redwash/60"
                  >
                    <LogOut size={17} />
                    Log Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="border-t border-glass-border bg-white lg:hidden">
          <div className="mx-auto max-w-7xl space-y-5 px-4 py-4 sm:px-6">
            <div>
              <div className="eyebrow px-2 pb-1">Main</div>
              <div className="grid gap-0.5">
                {PRIMARY_NAV.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={closeAll}
                    className={({ isActive }) =>
                      [
                        'flex items-center gap-3 rounded-xl px-3 py-2.5 text-[14px] font-semibold',
                        isActive ? 'glass-pill-active' : 'text-textdark hover:glass-tint',
                      ].join(' ')
                    }
                  >
                    <item.icon size={18} />
                    {item.label}
                  </NavLink>
                ))}
              </div>
            </div>

            <div>
              <div className="eyebrow px-2 pb-1">Explore</div>
              <div className="grid gap-0.5 sm:grid-cols-2">
                {EXPLORE_NAV.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={closeAll}
                    className={({ isActive }) =>
                      [
                        'flex items-center gap-3 rounded-xl px-3 py-2.5 text-[14px] font-semibold',
                        isActive ? 'glass-pill-active' : 'text-textdark hover:glass-tint',
                      ].join(' ')
                    }
                  >
                    <item.icon size={18} />
                    {item.label}
                  </NavLink>
                ))}
              </div>
            </div>

            <div className="border-t border-glass-border pt-3">
              <button
                type="button"
                onClick={() => go('/profile')}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[14px] font-semibold text-textdark hover:glass-tint"
              >
                <span className="glass-tint flex h-8 w-8 items-center justify-center rounded-full font-display text-[13px] font-bold text-mint-ink">
                  {initial}
                </span>
                {user.name}
              </button>
              <div className="mt-1 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setMobileOpen(false);
                    toast('Settings are coming soon.');
                  }}
                  className="flex items-center justify-center gap-2 rounded-xl border border-glass-border px-3 py-2.5 text-[13px] font-semibold text-textdark hover:bg-white"
                >
                  <Settings size={16} />
                  Settings
                </button>
                <button
                  type="button"
                  onClick={signOut}
                  className="flex items-center justify-center gap-2 rounded-xl border border-coral-ink/40 px-3 py-2.5 text-[13px] font-semibold text-coral-ink"
                >
                  <LogOut size={16} />
                  Log Out
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>

    {/* Click-away backdrop — covers page content (z-10) but sits below the bar (z-40),
        so dropdowns/drawer (children of the bar) stay clickable above it. */}
    {(mobileOpen || exploreOpen || profileOpen) && (
      <button
        type="button"
        aria-label="Close menu"
        onClick={closeAll}
        className="fixed inset-0 z-30 bg-textdark/5"
      />
    )}
    </>
  );
}
