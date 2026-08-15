// Mirrors lib/models/blood_request.dart (BloodUrgency + BloodRequest)
// and lib/services/donor_profile_service.dart (DonorProfile)
export type BloodUrgencyName = 'routine' | 'urgent' | 'critical';

export interface BloodUrgency {
  name: BloodUrgencyName;
  label: string;
}

export const BLOOD_URGENCIES: BloodUrgency[] = [
  { name: 'routine', label: 'Routine' },
  { name: 'urgent', label: 'Urgent' },
  { name: 'critical', label: 'Critical' },
];

export function urgencyLabel(name: BloodUrgencyName): string {
  const found = BLOOD_URGENCIES.find((u) => u.name === name);
  return found ? found.label : name;
}

export interface BloodRequest {
  id: string;
  patientName: string;
  bloodGroup: string;
  hospital: string;
  location: string;
  units: number;
  urgency: BloodUrgencyName;
  requiredBy: Date;
  contactNumber: string;
  notes: string;
}

/**
 * Carries the SERVER's eligibility verdict rather than deriving one — the
 * 90-day donation interval is a medical rule, evaluated once in the API so
 * every client renders the same answer. See utils/bloodEligibility.ts, which
 * now holds only display formatting, not the rule itself.
 */
export interface DonorProfile {
  available: boolean;
  bloodGroup?: string;
  lastDonated?: Date;
  eligible: boolean;
  daysUntilEligible: number;
  progress: number;
  statusCopy: string;
}

export const EMPTY_DONOR_PROFILE: DonorProfile = {
  available: false,
  bloodGroup: undefined,
  lastDonated: undefined,
  eligible: true,
  daysUntilEligible: 0,
  progress: 1,
  statusCopy: 'No donation recorded yet',
};

// Two-letter initials used in the request card avatar (BloodRequest.initials)
export function requestInitials(patientName: string): string {
  const parts = patientName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].substring(0, 1).toUpperCase();
  return (
    parts[0].substring(0, 1) + parts[parts.length - 1].substring(0, 1)
  ).toUpperCase();
}

// Short date formatter shared across the blood-bank screens (formatShortDate)
export function formatShortDate(d: Date): string {
  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ];
  return `${d.getDate().toString().padStart(2, '0')} ${months[d.getMonth()]} ${d.getFullYear()}`;
}
