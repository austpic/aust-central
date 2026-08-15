import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../components/Toast';
import type { BloodRequest, BloodUrgencyName } from '../models/bloodRequest';
import { BLOOD_URGENCIES } from '../models/bloodRequest';
import { BLOOD_GROUPS } from '../utils/bloodEligibility';
import { useBloodBankContext } from './BloodBankContext';

// Mirrors _BloodRequestFormScreenState in lib/screens/blood_request_form_screen.dart
export function useBloodRequestFormViewModel() {
  const navigate = useNavigate();
  const toast = useToast();
  const bank = useBloodBankContext();

  const [name, setName] = useState('');
  const [bloodGroup, setBloodGroup] = useState<string | null>(bank.profile.bloodGroup ?? null);
  const [hospital, setHospital] = useState('');
  const [location, setLocation] = useState('');
  const [units, setUnits] = useState('1');
  const [requiredBy, setRequiredBy] = useState<Date | null>(null);
  const [urgency, setUrgency] = useState<BloodUrgencyName>('routine');
  const [contact, setContact] = useState('');
  const [notes, setNotes] = useState('');
  const [requiredByError, setRequiredByError] = useState(false);

  const isBdPhone = (raw: string): boolean => /^\+?8801[3-9]\d{8}$|^01[3-9]\d{8}$/.test(raw.trim());

  function submit() {
    const trimmedName = name.trim();
    const trimmedHospital = hospital.trim();
    const trimmedContact = contact.trim();
    const unitCount = Number.parseInt(units, 10);

    const valid =
      trimmedName !== '' &&
      bloodGroup !== null &&
      trimmedHospital !== '' &&
      Number.isFinite(unitCount) &&
      unitCount >= 1 &&
      requiredBy !== null &&
      isBdPhone(trimmedContact);

    if (requiredBy === null) {
      setRequiredByError(true);
    } else {
      setRequiredByError(false);
    }
    if (!valid || requiredBy === null || bloodGroup === null) return;

    const request: BloodRequest = {
      id: `mine_${Date.now()}`,
      patientName: trimmedName,
      bloodGroup,
      hospital: trimmedHospital,
      location: location.trim(),
      units: unitCount,
      urgency,
      requiredBy,
      contactNumber: trimmedContact,
      notes: notes.trim(),
    };

    bank.addMyRequest(request);
    toast('Request submitted successfully!', 'success');
    navigate(-1);
  }

  function pickRequiredBy(date: Date) {
    setRequiredBy(date);
    setRequiredByError(false);
  }

  return {
    name,
    setName,
    bloodGroup,
    setBloodGroup,
    hospital,
    setHospital,
    location,
    setLocation,
    units,
    setUnits,
    requiredBy,
    pickRequiredBy,
    requiredByError,
    urgency,
    setUrgency,
    contact,
    setContact,
    notes,
    setNotes,
    bloodGroups: BLOOD_GROUPS,
    urgencies: BLOOD_URGENCIES,
    submit,
  };
}
