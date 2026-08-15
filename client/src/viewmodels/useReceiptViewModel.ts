import { useLocation } from 'react-router-dom';

// Mirrors ReceiptPage in lib/screens/receipt_page.dart (stateless in Flutter)
export function useReceiptViewModel() {
  const location = useLocation();
  const state = (location.state ?? {}) as {
    fromLocation?: string;
    toLocation?: string;
    selectedTime?: string;
    busName?: string;
    driverNumber?: string;
    route?: string[];
  };

  const routeString = (state.route ?? []).join(' → ');

  return {
    fromLocation: state.fromLocation ?? '',
    toLocation: state.toLocation ?? '',
    selectedTime: state.selectedTime ?? '',
    busName: state.busName ?? '',
    driverNumber: state.driverNumber ?? '',
    routeString,
  };
}
