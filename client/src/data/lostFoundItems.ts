// Mirrors the lost & found items in lib/screens/lost_found_screen.dart
import type { LostFoundItem } from '../models/lostFoundItem';

export const LOST_FOUND_CATEGORIES = [
  'All',
  'Bags',
  'Bottle',
  'ID Card',
  'Umbrella',
  'Electronics',
  'Mobile',
  'Charger',
  'Others',
];

export const LOST_FOUND_ITEMS: LostFoundItem[] = [
  { name: 'Backpack', date: '27 Feb 2025', color: 'Black', room: '7A06', category: 'Bags' },
  { name: 'Bottle', date: '25 Jan 2025', color: 'Blue', room: '4C02', category: 'Bottle' },
  { name: 'ID Card', date: '15 Apr 2024', color: 'N/A', room: 'N/A', category: 'ID Card' },
  { name: 'Umbrella', date: '15 Apr 2024', color: 'Grey', room: 'N/A', category: 'Umbrella' },
  { name: 'Charger', date: '10 Mar 2025', color: 'White', room: 'Library', category: 'Charger' },
];
