// Mirrors the _books list in lib/screens/book_exchange/book_exchange_screen.dart
// The Flutter source references assets that don't exist (book_placeholder.png);
// the UI falls back to a mint book icon, so we leave image undefined.
import type { BookListing } from '../models/bookListing';

export const SEED_BOOKS: BookListing[] = [
  {
    id: '1',
    title: 'Organic Chemistry: Structure & Function',
    course: 'CHEM 201',
    department: 'Chemistry',
    semester: 'Fall 2025',
    condition: 'Like New',
    tag: 'Swap / Free',
    seller: 'Shahidul Islam Arman',
    sellerId: 'seller_001',
    rating: '4.9',
  },
  {
    id: '2',
    title: 'Organic Chemistry: Structure & Function',
    course: 'CHEM 201',
    department: 'Chemistry',
    semester: 'Spring 2025',
    condition: 'Like New',
    tag: '300 BDT',
    seller: 'Shahidul Islam Arman',
    sellerId: 'seller_001',
    rating: '4.9',
  },
];
