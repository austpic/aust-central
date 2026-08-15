import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import MyStatusCard from '../components/MyStatusCard';
import SendRequestCta from '../components/SendRequestCta';
import BloodRequestCard from '../components/BloodRequestCard';
import SectionLabel from '../components/SectionLabel';
import { Dialog } from '../components/Modal';
import { useBloodBankViewModel } from '../viewmodels/useBloodBankViewModel';
import { BLOOD_GROUPS } from '../utils/bloodEligibility';

// Mirrors BloodBankScreen in lib/screens/blood_bank_screen.dart.
export default function BloodBankView() {
  const vm = useBloodBankViewModel();
  const [pickerDate, setPickerDate] = useState('');

  return (
    <div className="mx-auto w-full max-w-3xl">
      {/* Header */}
      <div className="flex items-center">
        <button
          type="button"
          onClick={() => history.back()}
          aria-label="Back"
          className="glass flex h-11 w-11 items-center justify-center rounded-full text-textdark transition-transform duration-200 hover:-translate-y-0.5"
        >
          <ArrowLeft size={24} />
        </button>
        <span className="ml-1 font-display text-[22px] font-bold tracking-tight text-textdark">Blood Bank</span>
      </div>

      <div className="mt-6">
        <MyStatusCard
          profile={vm.profile}
          onChanged={vm.updateProfile}
          onPickBloodGroup={vm.openBloodGroupPicker}
          onPickDate={vm.openDatePicker}
        />
      </div>

      <div className="mt-6">
        <SendRequestCta onTap={vm.openRequestForm} />
      </div>

      {vm.myRequests.length > 0 && (
        <>
          <div className="mt-8">
            <SectionLabel label="My Requests" count={vm.myRequests.length} />
          </div>
          <div className="grid grid-cols-1 gap-4">
            {vm.myRequests.map((request) => (
              <BloodRequestCard
                key={request.id}
                request={request}
                mine
                onCopy={() => vm.copyContact(request)}
                onCancel={() => vm.removeMyRequest(request.id)}
              />
            ))}
          </div>
        </>
      )}

      <div className="mt-8">
        <SectionLabel label="Active Requests Nearby" count={vm.feed.length} />
      </div>
      <div className="grid grid-cols-1 gap-4">
        {vm.feed.map((request) => (
          <BloodRequestCard
            key={request.id}
            request={request}
            onHelp={() => vm.onHelp(request)}
            onCopy={() => vm.copyContact(request)}
          />
        ))}
      </div>

      {/* Blood group picker */}
      {vm.bloodGroupPickerOpen && (
        <Dialog title="Select Blood Group" onClose={vm.closeBloodGroupPicker}>
          <div className="grid grid-cols-2 gap-3">
            {BLOOD_GROUPS.map((group) => (
              <button
                key={group}
                type="button"
                onClick={() => vm.chooseBloodGroup(group)}
                className={`rounded-[14px] py-3 text-[15px] font-bold transition-transform duration-200 hover:-translate-y-0.5 ${
                  vm.profile.bloodGroup === group
                    ? 'glass-pill-active'
                    : 'glass text-textdark'
                }`}
              >
                {group}
              </button>
            ))}
          </div>
        </Dialog>
      )}

      {/* Date picker */}
      {vm.datePickerOpen && (
        <Dialog title="Last Donation Date" onClose={vm.closeDatePicker}>
          <input
            type="date"
            value={pickerDate}
            onChange={(e) => setPickerDate(e.target.value)}
            className="glass-input w-full rounded-[14px] px-4 py-3 text-[15px] font-medium text-textdark outline-none"
          />
          <div className="mt-6 flex gap-3">
            <button
              type="button"
              onClick={vm.closeDatePicker}
              className="glass-tint flex-1 rounded-[14px] py-3 font-semibold text-dim"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                if (pickerDate) vm.chooseLastDonated(new Date(pickerDate));
              }}
              className="glass-accent flex-[2] rounded-[14px] py-3 font-semibold text-mint-ink"
            >
              Save
            </button>
          </div>
        </Dialog>
      )}
    </div>
  );
}
