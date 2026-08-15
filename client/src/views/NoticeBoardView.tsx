import { ArrowLeft, GraduationCap, FileText, CalendarDays, Info, Search } from 'lucide-react';
import NoticeCard from '../components/NoticeCard';
import FilterChip from '../components/FilterChip';
import EmptyState from '../components/EmptyState';
import { useNoticeBoardViewModel } from '../viewmodels/useNoticeBoardViewModel';
import { NOTICE_CATEGORIES, type NoticeCategoryName } from '../models/notice';
import { LoadingState, ErrorState } from '../components/AsyncState';
import type { ReactNode } from 'react';

const CATEGORY_ICONS: Record<NoticeCategoryName, ReactNode> = {
  academic: <GraduationCap size={16} />,
  exam: <FileText size={16} />,
  event: <CalendarDays size={16} />,
  general: <Info size={16} />,
};

export default function NoticeBoardView() {
  const vm = useNoticeBoardViewModel();

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
        <span className="ml-1 font-display text-[24px] font-bold tracking-tight text-textdark">Notice Board</span>
      </div>

      {/* Search */}
      <div className="glass-input mt-4 flex h-12 items-center rounded-[15px] px-4">
        <Search size={20} className="text-dim" />
        <input
          type="text"
          value={vm.search}
          onChange={(e) => vm.setSearch(e.target.value)}
          placeholder="Search notices…"
          className="ml-3 w-full bg-transparent text-[14px] text-textdark outline-none placeholder:text-dim"
        />
      </div>

      {/* Category filters */}
      <div className="mt-4 flex flex-wrap gap-3">
        <FilterChip
          label="All"
          selected={vm.filter === null}
          onSelect={() => vm.selectFilter(null)}
        />
        {NOTICE_CATEGORIES.map((c) => (
          <FilterChip
            key={c.name}
            label={c.label}
            icon={CATEGORY_ICONS[c.name]}
            selected={vm.filter === c.name}
            onSelect={() => vm.selectFilter(c.name)}
          />
        ))}
      </div>

      {/* Notices */}
      <div className="mt-4 grid grid-cols-1 gap-4">
        {vm.loading ? (
          <LoadingState />
        ) : vm.error ? (
          <ErrorState message={vm.error} onRetry={vm.reload} />
        ) : vm.notices.length === 0 ? (
          <EmptyState />
        ) : (
          vm.notices.map((notice) => (
            <NoticeCard
              key={notice.id}
              notice={notice}
              expanded={vm.isExpanded(notice.id)}
              onTap={() => vm.toggleExpanded(notice.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}
