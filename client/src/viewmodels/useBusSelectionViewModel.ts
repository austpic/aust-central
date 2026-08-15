import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AVAILABLE_BUSES } from '../data/busData';
import type { Bus } from '../models/transportation';

// Mirrors BusSelectionPage in lib/screens/bus_selection_page.dart
export function useBusSelectionViewModel() {
  const location = useLocation();
  const navigate = useNavigate();
  const state = (location.state ?? {}) as {
    fromLocation?: string;
    toLocation?: string;
    selectedTime?: string;
  };
  const [routeDialog, setRouteDialog] = useState<Bus | null>(null);
  const [contactDialog, setContactDialog] = useState<Bus | null>(null);

  function selectBus(bus: Bus) {
    navigate('/transport/receipt', {
      state: {
        fromLocation: state.fromLocation,
        toLocation: state.toLocation,
        selectedTime: state.selectedTime,
        busName: bus.name,
        driverNumber: bus.driverNumber,
        route: bus.route,
      },
    });
  }

  return {
    buses: AVAILABLE_BUSES,
    fromLocation: state.fromLocation ?? '',
    toLocation: state.toLocation ?? '',
    selectedTime: state.selectedTime ?? '',
    routeDialog,
    setRouteDialog,
    contactDialog,
    setContactDialog,
    selectBus,
  };
}
