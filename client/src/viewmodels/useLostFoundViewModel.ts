import { useCallback, useEffect, useState } from 'react';
import type { LostFoundItem } from '../models/lostFoundItem';
import { communityRepository } from '../repositories/community';
import { ApiError } from '../api/errors';

/** "27 Feb 2025" — locale-free, matching the rest of the app. */
function formatDate(iso: string): string {
  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ];
  const d = new Date(iso);
  return `${d.getDate().toString().padStart(2, '0')} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

// Mirrors LostFoundViewModel on the Flutter side — search and category
// filtering are server-side queries covering every item on campus, not an
// in-memory filter over five hardcoded fixtures.
export function useLostFoundViewModel() {
  const [items, setItems] = useState<LostFoundItem[]>([]);
  const [categories, setCategories] = useState<string[]>(['All']);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [{ items: rows }, cats] = await Promise.all([
        communityRepository.lostFoundItems(
          search.trim() || undefined,
          selectedCategory === 'All' ? undefined : selectedCategory,
          'FOUND',
        ),
        communityRepository.lostFoundCategories(),
      ]);
      setItems(
        rows.map((r) => ({
          id: r.id as string,
          name: r.name as string,
          date: formatDate(r.occurredOn as string),
          color: (r.color as string) || 'N/A',
          room: (r.room as string) || 'N/A',
          category: r.category as string,
        })),
      );
      // Built from categories actually in use, so a new one appears as soon
      // as someone reports an item under it.
      setCategories(['All', ...cats]);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not load lost & found.');
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategory, search]);

  // Debounced: search is a live onChange but filtering is now a server round
  // trip, so firing one on every keystroke would flood the API.
  useEffect(() => {
    const id = setTimeout(load, 300);
    return () => clearTimeout(id);
  }, [load]);

  function selectCategory(category: string) {
    setSelectedCategory(category);
  }

  return {
    categories,
    selectedCategory,
    selectCategory,
    search,
    setSearch,
    filtered: items,
    loading,
    error,
    reload: load,
  };
}
