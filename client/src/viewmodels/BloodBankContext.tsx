import { createContext, useContext, useState, type ReactNode } from 'react';
import type { BloodRequest, DonorProfile } from '../models/bloodRequest';
import { SEED_BLOOD_REQUESTS } from '../data/bloodRequests';
import { clampToPastOrToday } from '../utils/bloodEligibility';

// Shared state for the Blood Bank flow. Mirrors the Flutter wiring where the
// screen owns DonorProfile + my-requests (SharedPreferences-backed) and the
// form screen returns the created BloodRequest via Navigator.pop. Here the
// context is the persistence layer; screens read/write through it.
interface BloodBankState {
  profile: DonorProfile;
  updateProfile: (next: DonorProfile) => void;
  feed: BloodRequest[];
  myRequests: BloodRequest[];
  addMyRequest: (request: BloodRequest) => void;
  removeMyRequest: (id: string) => void;
  // Blood-group bottom sheet (MyStatusCard onPickBloodGroup)
  bloodGroupPickerOpen: boolean;
  openBloodGroupPicker: () => void;
  closeBloodGroupPicker: () => void;
  chooseBloodGroup: (group: string) => void;
  // Date picker (MyStatusCard onPickDate)
  datePickerOpen: boolean;
  openDatePicker: () => void;
  closeDatePicker: () => void;
  chooseLastDonated: (date: Date) => void;
}

const BloodBankContext = createContext<BloodBankState | null>(null);

export function BloodBankProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<DonorProfile>({
    available: false,
    bloodGroup: undefined,
    lastDonated: undefined,
  });
  const [myRequests, setMyRequests] = useState<BloodRequest[]>([]);
  const [bloodGroupPickerOpen, setBloodGroupPickerOpen] = useState(false);
  const [datePickerOpen, setDatePickerOpen] = useState(false);

  const state: BloodBankState = {
    profile,
    updateProfile: (next) => setProfile(next),
    feed: SEED_BLOOD_REQUESTS,
    myRequests,
    addMyRequest: (request) => setMyRequests((prev) => [request, ...prev]),
    removeMyRequest: (id) => setMyRequests((prev) => prev.filter((r) => r.id !== id)),
    bloodGroupPickerOpen,
    openBloodGroupPicker: () => setBloodGroupPickerOpen(true),
    closeBloodGroupPicker: () => setBloodGroupPickerOpen(false),
    chooseBloodGroup: (group) => {
      setProfile((prev) => ({ ...prev, bloodGroup: group }));
      setBloodGroupPickerOpen(false);
    },
    datePickerOpen,
    openDatePicker: () => setDatePickerOpen(true),
    closeDatePicker: () => setDatePickerOpen(false),
    chooseLastDonated: (date) => {
      setProfile((prev) => ({ ...prev, lastDonated: clampToPastOrToday(date) }));
      setDatePickerOpen(false);
    },
  };

  return <BloodBankContext.Provider value={state}>{children}</BloodBankContext.Provider>;
}

export function useBloodBankContext(): BloodBankState {
  const ctx = useContext(BloodBankContext);
  if (!ctx) throw new Error('useBloodBankContext must be used within BloodBankProvider');
  return ctx;
}
