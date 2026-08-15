import { ArrowLeft, Star, BookOpen, Bookmark, History, Settings, ChevronRight } from 'lucide-react';
import { useBookProfileViewModel } from '../viewmodels/useBookProfileViewModel';

const TILE_ICONS: Record<string, React.ReactNode> = {
  list: <BookOpen size={20} />,
  bookmark: <Bookmark size={20} />,
  history: <History size={20} />,
  settings: <Settings size={20} />,
};

// Mirrors BookProfilePage in lib/screens/book_exchange/book_profile_page.dart.
export default function BookProfileView() {
  const vm = useBookProfileViewModel();

  return (
    <div className="mx-auto w-full max-w-3xl">
      {/* Header */}
      <div className="flex items-center">
        <button
          type="button"
          onClick={vm.goBack}
          aria-label="Back"
          className="glass flex h-11 w-11 items-center justify-center rounded-full text-darkgreen transition-transform duration-200 hover:-translate-y-0.5"
        >
          <ArrowLeft size={24} />
        </button>
        <span className="ml-1 font-display text-[20px] font-bold tracking-tight text-textdark">My Profile</span>
      </div>

      <div className="mt-6 text-center">
        <div className="glass-tint mx-auto flex h-[88px] w-[88px] items-center justify-center rounded-full shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]">
          <span className="text-[30px] font-bold text-darkgreen">
            {vm.user.name.charAt(0)}
          </span>
        </div>
        <div className="mt-4 font-display text-[18px] font-bold tracking-tight text-ink">{vm.user.name}</div>
        <div className="mt-2 flex items-center justify-center gap-2">
          <Star size={16} className="text-warning" />
          <span className="font-mono text-[11px] text-black54">{vm.rating}</span>
        </div>
      </div>

      <div className="mt-8 space-y-4">
        {vm.tiles.map((tile) => (
          <button
            key={tile.icon}
            type="button"
            className="glass glass-sheen flex w-full items-center rounded-[16px] px-4 py-3 text-left transition-shadow duration-200 hover:shadow-glass-lg"
          >
            <span className="glass-tint rounded-[10px] p-2 text-darkgreen shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]">
              {TILE_ICONS[tile.icon]}
            </span>
            <span className="ml-3 flex-1 font-display text-[15px] font-semibold text-ink">{tile.label}</span>
            <ChevronRight size={20} className="text-black38" />
          </button>
        ))}
      </div>
    </div>
  );
}
