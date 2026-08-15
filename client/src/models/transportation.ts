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
}
