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

/** BookFilter -> the `sort` query param the server understands. */
export function filterToSort(filter: BookFilter): string {
  switch (filter) {
    case 'department':
      return 'department';
    case 'course':
      return 'courseCode';
    case 'semester':
      return 'semester';
    case 'freeswap':
      return 'freeFirst';
  }
}

function conditionLabel(raw: string): string {
  switch (raw) {
    case 'NEW':
      return 'New';
    case 'LIKE_NEW':
      return 'Like New';
    case 'GOOD':
      return 'Good';
    case 'FAIR':
      return 'Fair';
    default:
      return 'Poor';
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Json = any;

/**
 * Flattens a server listing (matches listingResponseSchema on the API) into
 * the display shape the existing card/detail UI expects. Mirrors
 * BookExchangeViewModel._toCardMap in lib/viewmodels/book_exchange_view_model.dart.
 */
export function toBookListing(row: Json): BookListing & { isBookmarked: boolean; isMine: boolean } {
  const seller = row.seller as { id: string; name: string; rating: number | null };
  const type = row.listingType as string;
  const price = row.priceBdt as number | null;

  return {
    id: row.id as string,
    title: row.title as string,
    course: row.courseCode as string,
    department: row.department as string,
    semester: row.semester as string,
    condition: conditionLabel(row.condition as string),
    // SALE shows a price; SWAP/FREE show what they are.
    tag: type === 'SALE' ? `${price} BDT` : type === 'FREE' ? 'Free' : 'Swap',
    seller: seller.name,
    sellerId: seller.id,
    // No reviews yet means no rating -- a dash, not an invented 4.9.
    rating: seller.rating === null ? '—' : seller.rating.toString(),
    isBookmarked: Boolean(row.isBookmarked),
    isMine: Boolean(row.isMine),
  };
}
