/**
 * Campus transport — informational only.
 *
 * Stops, buses, routes, and departures are reference data: read-only to
 * students, seeded from the app's existing fixtures, and editable only by
 * admins (currently via seed/DB rather than an API surface).
 *
 * There is deliberately no booking or ticketing here. The campus buses do not
 * reserve seats — a student needs to know which bus serves their route and
 * when it leaves, and nothing else. Modelling tickets would have added a
 * user-owned entity, its ownership rules, and a cancellation flow for a
 * capability that does not exist in the real world.
 */

const WEEKDAYS = [
  'SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY',
];

const busInclude = {
  routeStops: { orderBy: { position: 'asc' }, include: { stop: true } },
};

function toBusResponse(bus) {
  return {
    id: bus.id,
    name: bus.name,
    driverName: bus.driverName,
    driverNumber: bus.driverNumber,
    route: (bus.routeStops ?? []).map((rs) => ({ id: rs.stop.id, name: rs.stop.name })),
  };
}

export async function listStops(app) {
  const stops = await app.prisma.busStop.findMany({ orderBy: { name: 'asc' } });
  return stops.map((s) => ({ id: s.id, name: s.name }));
}

export async function listBuses(app) {
  const buses = await app.prisma.bus.findMany({
    where: { active: true },
    orderBy: { name: 'asc' },
    include: busInclude,
  });
  return buses.map(toBusResponse);
}

/**
 * Departures matching an optional origin/destination pair and date.
 *
 * The from-before-to ordering check runs in JS over the already-loaded route,
 * because expressing "position of A < position of B on the same bus" in a
 * single Prisma query would need a raw self-join for no real gain at this size.
 */
export async function searchDepartures(app, query) {
  const date = query.date ?? new Date();
  const weekday = WEEKDAYS[date.getDay()];

  const departures = await app.prisma.departure.findMany({
    where: {
      daysOfWeek: { has: weekday },
      bus: { active: true },
    },
    orderBy: { departureTime: 'asc' },
    include: { bus: { include: busInclude } },
  });

  const filtered = departures.filter((departure) => {
    if (!query.from && !query.to) return true;

    const route = departure.bus.routeStops;
    const fromIndex = query.from
      ? route.findIndex((rs) => rs.stopId === query.from)
      : 0;
    const toIndex = query.to
      ? route.findIndex((rs) => rs.stopId === query.to)
      : route.length - 1;

    if (fromIndex === -1 || toIndex === -1) return false;
    // A bus that reaches the destination before the origin does not serve
    // this journey, even though it visits both stops.
    return fromIndex < toIndex;
  });

  return filtered.map((d) => ({
    id: d.id,
    departureTime: d.departureTime,
    daysOfWeek: d.daysOfWeek,
    bus: toBusResponse(d.bus),
  }));
}
