// Mirrors the seed feed + defaults in lib/services/blood_request_service.dart
// and lib/services/donor_profile_service.dart
import type { BloodRequest } from '../models/bloodRequest';

function inHours(hours: number): Date {
  return new Date(Date.now() + hours * 60 * 60 * 1000);
}

export const SEED_BLOOD_REQUESTS: BloodRequest[] = [
  {
    id: 'seed_1',
    patientName: 'Nazia Rahman',
    bloodGroup: 'A+',
    hospital: 'Square Hospital',
    location: 'Panthapath, Dhaka',
    units: 2,
    urgency: 'critical',
    requiredBy: inHours(6),
    contactNumber: '+8801711122334',
    notes: 'ICU admission — needs platelets too',
  },
  {
    id: 'seed_2',
    patientName: 'Rakib Hasan',
    bloodGroup: 'O-',
    hospital: 'AUST Medical Center',
    location: 'Campus',
    units: 1,
    urgency: 'urgent',
    requiredBy: inHours(24),
    contactNumber: '+8801922334455',
    notes: '',
  },
  {
    id: 'seed_3',
    patientName: 'Tasnim Akter',
    bloodGroup: 'B+',
    hospital: 'United Hospital',
    location: 'Gulshan, Dhaka',
    units: 3,
    urgency: 'routine',
    requiredBy: inHours(72),
    contactNumber: '+8801555667788',
    notes: 'Surgery scheduled',
  },
  {
    id: 'seed_4',
    patientName: 'Imran Chowdhury',
    bloodGroup: 'AB+',
    hospital: 'Lab Aid Hospital',
    location: 'Dhanmondi, Dhaka',
    units: 2,
    urgency: 'urgent',
    requiredBy: inHours(48),
    contactNumber: '+8801611990022',
    notes: '',
  },
];
