import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../components/Toast';
import type { BloodUrgencyName } from '../models/bloodRequest';
import { BLOOD_URGENCIES } from '../models/bloodRequest';
import { BLOOD_GROUPS } from '../utils/bloodEligibility';
import { useBloodBankContext } from './BloodBankContext';
import { communityRepository } from '../repositories/community';
import { ApiError } from '../api/errors';

// Mirrors _BloodRequestFormScreenState in
// lib/views/blood/blood_request_form_screen.dart — submits to the server, so
// the request is visible to every student. It previously went only into this
// device's context state, where no potential donor could ever see it.
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
  const [submitting, setSubmitting] = useState(false);

  const isBdPhone = (raw: string): boolean => /^\+?8801[3-9]\d{8}$|^01[3-9]\d{8}$/.test(raw.trim());

  async function submit() {
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

    setRequiredByError(requiredBy === null);
    if (!valid || requiredBy === null || bloodGroup === null || submitting) return;

    setSubmitting(true);
    try {
      const created = await communityRepository.createBloodRequest({
        patientName: trimmedName,
        bloodGroup,
        hospital: trimmedHospital,
        location: location.trim(),
        units: unitCount,
        urgency: urgency.toUpperCase(),
        requiredBy: requiredBy.toISOString(),
        contactNumber: trimmedContact,
        notes: notes.trim(),
      });

      bank.addMyRequest({
        id: created.id,
        patientName: created.patientName,
        bloodGroup: created.bloodGroup,
        hospital: created.hospital,
        location: created.location ?? '',
        units: created.units,
        urgency,
        requiredBy: new Date(created.requiredBy),
        contactNumber: created.contactNumber,
        notes: created.notes ?? '',
      });
      toast('Request submitted successfully!', 'success');
      navigate(-1);
    } catch (error) {
      const fieldError = error instanceof ApiError ? error.errorFor('contactNumber') : undefined;
      toast(fieldError ?? (error instanceof ApiError ? error.message : 'Could not submit the request.'), 'error');
    } finally {
      setSubmitting(false);
    }
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
    submitting,
    submit,
  };
}
