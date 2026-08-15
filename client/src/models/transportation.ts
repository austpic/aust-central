// Mirrors the transport flow data:
//  - lib/screens/bus_page.dart (bus stops)
//  - lib/screens/schedule_page.dart (schedule times)
//  - lib/screens/bus_selection_page.dart (bus + route)
//  - lib/screens/receipt_page.dart (receipt view)
export interface BusStop {
  name: string;
}

export interface ScheduleItem {
  time: string;
}

export interface Bus {
  name: string;
  driverNumber: string;
  route: string[];
  /** The bus's real departure time from the server, when known. */
  departureTime?: string;
}

// The schedule slot list stays a client-side constant here on purpose — it
// mirrors _SchedulePageState in lib/views/transport/schedule_page.dart,
// which keeps the same list rather than fetching it. The actual departure
// time shown to the rider comes from the bus record once a route is picked.
export const BUS_SCHEDULES: ScheduleItem[] = [
  { time: '06 : 00 am' },
  { time: '08 : 30 am' },
  { time: '01 : 30 pm' },
  { time: '03 : 30 pm' },
  { time: '06 : 30 pm' },
];
