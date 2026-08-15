import { useCallback, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { platformRepository } from '../repositories/platform';
import { ApiError } from '../api/errors';
import type { Bus } from '../models/transportation';

// Mirrors BusSelectionViewModel in lib/viewmodels/transport_view_model.dart.
// The buses here used to be a hardcoded literal shown for every journey,
// regardless of which stops the student picked. The list now comes from the
// server, which only returns buses whose route reaches the origin *before*
// the destination — so the reverse direction correctly shows nothing.
export function useBusSelectionViewModel() {
  const location = useLocation();
  const navigate = useNavigate();
  const state = (location.state ?? {}) as {
    fromLocation?: string;
    toLocation?: string;
    selectedTime?: string;
  };
  const fromLocation = state.fromLocation ?? '';
  const toLocation = state.toLocation ?? '';

  const [buses, setBuses] = useState<Bus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [routeDialog, setRouteDialog] = useState<Bus | null>(null);
  const [contactDialog, setContactDialog] = useState<Bus | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const stops = await platformRepository.stops();
      const idFor = (name: string): string | undefined =>
        stops.find((s) => s.name === name)?.id as string | undefined;

      const departures = await platformRepository.departures(
        idFor(fromLocation),
        idFor(toLocation),
      );

      setBuses(
        departures.map((d) => ({
          name: d.bus.name as string,
          driverNumber: d.bus.driverNumber as string,
          route: (d.bus.route as { name: string }[]).map((s) => s.name),
          departureTime: d.departureTime as string,
        })),
      );
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not load buses.');
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fromLocation, toLocation]);

  useEffect(() => {
    load();
  }, [load]);

  function selectBus(bus: Bus) {
    navigate('/transport/receipt', {
      state: {
        fromLocation,
        toLocation,
        // The bus's real departure time from the server, not the slot the
        // user tapped on the previous screen.
        selectedTime: bus.departureTime ?? state.selectedTime,
        busName: bus.name,
        driverNumber: bus.driverNumber,
        route: bus.route,
      },
    });
  }

  return {
    buses,
    loading,
    error,
    reload: load,
    fromLocation,
    toLocation,
    selectedTime: state.selectedTime ?? '',
    routeDialog,
    setRouteDialog,
    contactDialog,
    setContactDialog,
    selectBus,
  };
}
