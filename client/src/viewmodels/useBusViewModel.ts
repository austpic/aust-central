import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BUS_STOPS } from '../data/busData';

// Mirrors _LocationCardState in lib/screens/bus_page.dart
export function useBusViewModel() {
  const navigate = useNavigate();
  const [selectedFrom, setSelectedFrom] = useState<string | undefined>(undefined);
  const [selectedTo, setSelectedTo] = useState<string | undefined>(undefined);

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

  return { places: BUS_STOPS, selectedFrom, selectedTo, selectFrom, selectTo };
}
