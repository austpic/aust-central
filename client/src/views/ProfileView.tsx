import { useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Mail, LogOut } from 'lucide-react';
import { useProfileViewModel } from '../viewmodels/useProfileViewModel';
import { useAuth } from '../viewmodels/AuthContext';

// Mirrors ProfileScreen in lib/views/profile/profile_screen.dart — avatar
// initial, name + email, and a details card.
export default function ProfileView() {
  const vm = useProfileViewModel();
  const { signOut: endSession } = useAuth();
  const navigate = useNavigate();

  async function signOut() {
    await endSession();
    navigate('/login', { replace: true });
  }

  return (
    <div className="mx-auto w-full max-w-3xl">
      {/* Header */}
      <div className="flex items-center">
        <button
          type="button"
          onClick={() => history.back()}
          aria-label="Back"
          className="glass flex h-11 w-11 items-center justify-center rounded-full text-darkgreen transition-transform duration-200 hover:-translate-y-0.5"
        >
          <ArrowLeft size={24} />
        </button>
        <span className="ml-1 font-display text-[22px] font-bold tracking-tight text-textdark">User Profile</span>
      </div>

      <div className="mt-6 text-center">
        <div className="glass-tint mx-auto flex h-24 w-24 items-center justify-center rounded-full shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]">
          <span className="font-display text-[36px] font-bold text-mint-ink">{vm.initial}</span>
        </div>
        <div className="mt-4 font-display text-[22px] font-bold tracking-tight text-textdark">{vm.user.name}</div>
        <div className="mt-1 text-[13px] text-dim">{vm.user.email}</div>
      </div>

      <div className="glass glass-sheen mt-8 overflow-hidden rounded-[20px] transition-shadow duration-200 hover:shadow-glass-lg">
        <div className="flex items-center px-4 py-4">
          <User size={22} className="shrink-0 text-mint-ink" />
          <div className="ml-4">
            <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.08em] text-dim">Name</div>
            <div className="mt-0.5 font-display text-[15px] font-semibold text-textdark">{vm.user.name}</div>
          </div>
        </div>
        <div className="h-px bg-glass-border" />
        <div className="flex items-center px-4 py-4">
          <Mail size={22} className="shrink-0 text-mint-ink" />
          <div className="ml-4">
            <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.08em] text-dim">Email</div>
            <div className="mt-0.5 font-display text-[15px] font-semibold text-textdark">{vm.user.email}</div>
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={signOut}
        className="glass mt-8 flex h-12 w-full items-center justify-center gap-2 rounded-[14px] border-[1.5px] border-coral-ink/40 font-semibold text-coral-ink transition-transform duration-200 hover:-translate-y-0.5"
      >
        <LogOut size={18} />
        Sign Out
      </button>
    </div>
  );
}
