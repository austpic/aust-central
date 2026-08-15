import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import type { BloodRequest, DonorProfile } from '../models/bloodRequest';
import { EMPTY_DONOR_PROFILE } from '../models/bloodRequest';
import { communityRepository } from '../repositories/community';
import { clampToPastOrToday } from '../utils/bloodEligibility';
import { ApiError } from '../api/errors';

/**
 * Shared state for the Blood Bank flow. Mirrors BloodBankViewModel on the
 * Flutter side: the community feed is genuinely community-wide (a request
 * posted by another student appears here — impossible when requests lived in
 * this device's own storage), and eligibility comes from the server.
 */
interface BloodBankState {
  profile: DonorProfile;
  updateProfile: (next: DonorProfile) => void;
  feed: BloodRequest[];
  myRequests: BloodRequest[];
  addMyRequest: (request: BloodRequest) => void;
  removeMyRequest: (id: string) => void;
  loading: boolean;
  error: string | null;
  reload: () => void;
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

function profileFromJson(json: Record<string, unknown>): DonorProfile {
  return {
    available: Boolean(json.available),
    bloodGroup: (json.bloodGroup as string | null) ?? undefined,
    lastDonated: json.lastDonated ? new Date(json.lastDonated as string) : undefined,
    eligible: (json.eligible as boolean) ?? true,
    daysUntilEligible: (json.daysUntilEligible as number) ?? 0,
    progress: (json.progress as number) ?? 1,
    statusCopy: (json.statusCopy as string) ?? 'No donation recorded yet',
  };
}

function requestFromJson(json: Record<string, unknown>): BloodRequest {
  return {
    id: json.id as string,
    patientName: json.patientName as string,
    bloodGroup: json.bloodGroup as string,
    hospital: json.hospital as string,
    location: (json.location as string) ?? '',
    units: json.units as number,
    urgency: (json.urgency as string).toLowerCase() as BloodRequest['urgency'],
    requiredBy: new Date(json.requiredBy as string),
    contactNumber: json.contactNumber as string,
    notes: (json.notes as string) ?? '',
  };
}

export function BloodBankProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<DonorProfile>(EMPTY_DONOR_PROFILE);
  const [feed, setFeed] = useState<BloodRequest[]>([]);
  const [myRequests, setMyRequests] = useState<BloodRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bloodGroupPickerOpen, setBloodGroupPickerOpen] = useState(false);
  const [datePickerOpen, setDatePickerOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [profileJson, allRequests, mineRequests] = await Promise.all([
        communityRepository.donorProfile(),
        communityRepository.bloodRequests(),
        communityRepository.bloodRequests('OPEN', undefined, true),
      ]);

      const mine = (mineRequests.items as Record<string, unknown>[]).map(requestFromJson);
      const mineIds = new Set(mine.map((r) => r.id));

      setProfile(profileFromJson(profileJson));
      setMyRequests(mine);
      // Own requests get their own section above, so excluding them from the
      // feed avoids listing them twice.
      setFeed(
        (allRequests.items as Record<string, unknown>[])
          .map(requestFromJson)
          .filter((r) => !mineIds.has(r.id)),
      );
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not load the blood bank.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function updateProfile(next: DonorProfile) {
    const previous = profile;
    setProfile(next);
    try {
      const saved = await communityRepository.updateDonorProfile({
        available: next.available,
        bloodGroup: next.bloodGroup,
        lastDonated: next.lastDonated?.toISOString(),
      });
      // Adopt the server's copy — eligibility is computed there.
      setProfile(profileFromJson(saved));
    } catch {
      setProfile(previous);
    }
  }

  async function removeMyRequest(id: string) {
    setMyRequests((prev) => prev.filter((r) => r.id !== id));
    try {
      await communityRepository.setBloodRequestStatus(id, 'CANCELLED');
    } catch {
      await load();
    }
  }

  const state: BloodBankState = {
    profile,
    updateProfile,
    feed,
    myRequests,
    // The create flow now happens through the form's own API call; this adds
    // the server's response to local state without a full reload.
    addMyRequest: (request) => setMyRequests((prev) => [request, ...prev]),
    removeMyRequest,
    loading,
    error,
    reload: () => {
      load();
    },
    bloodGroupPickerOpen,
    openBloodGroupPicker: () => setBloodGroupPickerOpen(true),
    closeBloodGroupPicker: () => setBloodGroupPickerOpen(false),
    chooseBloodGroup: (group) => {
      updateProfile({ ...profile, bloodGroup: group });
      setBloodGroupPickerOpen(false);
    },
    datePickerOpen,
    openDatePicker: () => setDatePickerOpen(true),
    closeDatePicker: () => setDatePickerOpen(false),
    chooseLastDonated: (date) => {
      updateProfile({ ...profile, lastDonated: clampToPastOrToday(date) });
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
