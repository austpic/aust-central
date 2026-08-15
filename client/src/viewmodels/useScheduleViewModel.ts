import { useLocation, useNavigate } from 'react-router-dom';
import { BUS_SCHEDULES } from '../data/busData';

// Mirrors _SchedulePageState in lib/screens/schedule_page.dart
export function useScheduleViewModel() {
  const location = useLocation();
  const navigate = useNavigate();
  const state = (location.state ?? {}) as { fromLocation?: string; toLocation?: string };

  function selectTime(time: string) {
    navigate('/transport/buses', {
      state: { fromLocation: state.fromLocation, toLocation: state.toLocation, selectedTime: time },
    });
  }

  return { schedules: BUS_SCHEDULES, fromLocation: state.fromLocation ?? '', toLocation: state.toLocation ?? '', selectTime };
}
