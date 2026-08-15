// Mirrors transport data:
//  - places list in lib/screens/bus_page.dart
//  - schedules list in lib/screens/schedule_page.dart
//  - buses list in lib/screens/bus_selection_page.dart
import type { Bus, ScheduleItem } from '../models/transportation';

export const BUS_STOPS: string[] = [
  'Mirpur',
  'Ansar Camp',
  'Technical',
  'Kalyanpur',
  'Shyamoli',
  'Ring Road',
  'Shia Mashjid',
  'Mohammadpur',
  'Asadgate',
  'Manik Mia',
  'Khamar Bari',
  'Farmgate',
];

export const BUS_SCHEDULES: ScheduleItem[] = [
  { time: '06 : 00 am' },
  { time: '08 : 30 am' },
  { time: '01 : 30 pm' },
  { time: '03 : 30 pm' },
  { time: '06 : 30 pm' },
];

export const AVAILABLE_BUSES: Bus[] = [
  {
    name: 'Meghna - 1',
    driverNumber: '+880 1711-000001',
    route: ['Farmgate', 'Bijoy Sarani', 'Mohakhali', 'Aust'],
  },
  {
    name: 'Jamuna - 2',
    driverNumber: '+880 1711-000002',
    route: ['Farmgate', 'Banani', 'Mohakhali', 'Aust'],
  },
  {
    name: 'Padma - 1',
    driverNumber: '+880 1711-000003',
    route: ['Farmgate', 'Bijoy Sarani', 'Gulshan', 'Aust'],
  },
];
