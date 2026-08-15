import { useNavigate } from 'react-router-dom';
import { useToast } from '../components/Toast';
import { useBloodBankContext } from './BloodBankContext';

// Mirrors _BloodBankScreenState in lib/screens/blood_bank_screen.dart.
// Layout: My Donor Status card, Send Request CTA, "My Requests" (only when
// non-empty), then "Active Requests Nearby" feed.
export function useBloodBankViewModel() {
  const navigate = useNavigate();
  const toast = useToast();
  const bank = useBloodBankContext();

  function openRequestForm() {
    navigate('/blood-bank/request');
  }

  function copyContact(request: { patientName: string; contactNumber: string }) {
    void navigator.clipboard?.writeText(request.contactNumber).catch(() => {});
    toast(`Contact copied for ${request.patientName}.`, 'success');
  }

  function onHelp(request: { patientName: string }) {
    toast(`Thanks — your interest has been recorded for ${request.patientName}.`, 'default');
  }

  return {
    profile: bank.profile,
    updateProfile: bank.updateProfile,
    feed: bank.feed,
    myRequests: bank.myRequests,
    bloodGroupPickerOpen: bank.bloodGroupPickerOpen,
    openBloodGroupPicker: bank.openBloodGroupPicker,
    closeBloodGroupPicker: bank.closeBloodGroupPicker,
    chooseBloodGroup: bank.chooseBloodGroup,
    datePickerOpen: bank.datePickerOpen,
    openDatePicker: bank.openDatePicker,
    closeDatePicker: bank.closeDatePicker,
    chooseLastDonated: bank.chooseLastDonated,
    openRequestForm,
    copyContact,
    onHelp,
    removeMyRequest: bank.removeMyRequest,
  };
}
