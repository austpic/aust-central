import { useMemo, useState } from 'react';
import { SEED_NOTICES } from '../data/notices';
import type { NoticeCategoryName } from '../models/notice';
import { categoryFromName } from '../models/notice';

// Mirrors _NoticeBoardScreenState in lib/screens/notice_board_screen.dart
export function useNoticeBoardViewModel() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<NoticeCategoryName | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const visible = useMemo(() => {
    const query = search.trim().toLowerCase();
    return SEED_NOTICES.filter((n) => {
      const matchesCat = filter === null || n.category === filter;
      const matchesSearch =
        query === '' ||
        n.title.toLowerCase().includes(query) ||
        n.body.toLowerCase().includes(query);
      return matchesCat && matchesSearch;
    }).sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      return b.postedAt.getTime() - a.postedAt.getTime();
    });
  }, [search, filter]);

  function toggleExpanded(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function selectFilter(name: NoticeCategoryName | null) {
    setFilter(name);
  }

  return {
    notices: visible,
    search,
    setSearch,
    filter,
    selectFilter,
    isExpanded: (id: string) => expanded.has(id),
    toggleExpanded,
    categoryFromName,
  };
}
