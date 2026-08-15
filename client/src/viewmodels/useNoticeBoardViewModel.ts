import { useCallback, useEffect, useState } from 'react';
import type { Notice, NoticeCategoryName } from '../models/notice';
import { categoryFromName } from '../models/notice';
import { communityRepository } from '../repositories/community';
import { ApiError } from '../api/errors';

// Mirrors NoticeBoardViewModel on the Flutter side — category and search
// filtering are server-side queries now, so the board is never capped by
// whatever a hardcoded fixture list happened to contain.
export function useNoticeBoardViewModel() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<NoticeCategoryName | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { items } = await communityRepository.listNotices(
        filter ? filter.toUpperCase() : undefined,
        search.trim() || undefined,
      );
      setNotices(
        items.map((n) => ({
          id: n.id,
          title: n.title,
          body: n.body,
          postedAt: new Date(n.postedAt),
          category: categoryFromName((n.category as string).toLowerCase()),
          pinned: Boolean(n.pinned),
        })),
      );
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not load notices.');
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, search]);

  // Debounced: the search box is a live onChange, but filtering is now a
  // server round trip, so firing one on every keystroke would flood the API.
  useEffect(() => {
    const id = setTimeout(load, 300);
    return () => clearTimeout(id);
  }, [load]);

  function toggleExpanded(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectFilter(name: NoticeCategoryName | null) {
    setFilter(name);
  }

  return {
    notices,
    search,
    setSearch,
    filter,
    selectFilter,
    isExpanded: (id: string) => expanded.has(id),
    toggleExpanded,
    categoryFromName,
    loading,
    error,
    reload: load,
  };
}
