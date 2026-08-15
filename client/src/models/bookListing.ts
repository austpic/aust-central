// Mirrors the book listings used across lib/screens/book_exchange/
// (originally List<Map<String, String>> — typed here for safety)
export interface BookListing {
  id: string;
  title: string;
  course: string;
  department: string;
  semester: string;
  condition: string;
  tag: string;
  seller: string;
  sellerId: string;
  rating: string;
  image?: string;
}

export type BookTab = 'browse' | 'mine' | 'saved';

export type BookFilter = 'department' | 'course' | 'semester' | 'freeswap';

export const BOOK_TABS: { key: BookTab; label: string }[] = [
  { key: 'browse', label: 'Browse' },
  { key: 'mine', label: 'My Listings' },
  { key: 'saved', label: 'Saved' },
];

export const BOOK_FILTERS: { key: BookFilter; label: string }[] = [
  { key: 'department', label: 'Department' },
  { key: 'course', label: 'Course Code' },
  { key: 'semester', label: 'Semester' },
  { key: 'freeswap', label: 'Free/Swap' },
];
