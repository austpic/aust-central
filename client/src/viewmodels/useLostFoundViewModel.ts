import { useMemo, useState } from 'react';
import { LOST_FOUND_CATEGORIES, LOST_FOUND_ITEMS } from '../data/lostFoundItems';

// Mirrors _LostFoundScreenState in lib/screens/lost_found_screen.dart
export function useLostFoundViewModel() {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return LOST_FOUND_ITEMS.filter((item) => {
      const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
      const matchesSearch = query === '' || item.name.toLowerCase().includes(query);
      return matchesCategory && matchesSearch;
    });
  }, [search, selectedCategory]);

  function selectCategory(category: string) {
    setSelectedCategory(category);
  }

  return {
    categories: LOST_FOUND_CATEGORIES,
    selectedCategory,
    selectCategory,
    search,
    setSearch,
    filtered,
  };
}
