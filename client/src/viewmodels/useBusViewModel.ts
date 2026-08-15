import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { platformRepository } from '../repositories/platform';

// Mirrors BusStopsViewModel in lib/viewmodels/transport_view_model.dart.
// Stops are reference data owned by the server, so adding one is an
// operations change rather than an app release.
const FALLBACK_PLACES = [
  'Mirpur', 'Ansar Camp', 'Technical', 'Kalyanpur', 'Shyamoli', 'Ring Road',
  'Shia Mashjid', 'Mohammadpur', 'Asadgate', 'Manik Mia', 'Khamar Bari',
  'Farmgate',
];

export function useBusViewModel() {
  const navigate = useNavigate();
  const [places, setPlaces] = useState<string[]>(FALLBACK_PLACES);
  const [selectedFrom, setSelectedFrom] = useState<string | undefined>(undefined);
  const [selectedTo, setSelectedTo] = useState<string | undefined>(undefined);

  const load = useCallback(async () => {
    // Deliberately does not surface an error state: the fallback list keeps
    // the picker usable offline, which is better than blocking the screen.
    try {
      const stops = await platformRepository.stops();
      setPlaces(stops.map((s) => s.name as string));
    } catch {
      // keep the fallback list
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function selectFrom(value: string) {
    setSelectedFrom(value);
  }

  function selectTo(value: string) {
    setSelectedTo(value);
    if (selectedFrom && value) {
      navigate('/transport/schedule', {
        state: { fromLocation: selectedFrom, toLocation: value },
      });
    }
  }

  return { places, selectedFrom, selectedTo, selectFrom, selectTo };
}
