import { z } from 'zod';

/**
 * Campus transport reference data: stops, buses, routes, departures.
 *
 * The API exposes transport read-only — there is no admin endpoint for it — so
 * this loader is how the data gets into any database, production included.
 * Shared by the dev seed (with transport.example.json) and
 * scripts/load-transport.js (with the operator's real file).
 *
 * Idempotent: stops and buses are upserted by name, each listed bus's route is
 * rebuilt, and its departures are replaced with the listed set. Buses absent
 * from the file are marked inactive rather than deleted, so nothing that
 * references them breaks.
 */

const clock = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Use 24-hour HH:mm');
const weekday = z.enum([
  'SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY',
]);

export const transportFileSchema = z
  .object({
    stops: z.array(z.string().trim().min(1).max(120)).min(1),
    buses: z
      .array(
        z
          .object({
            name: z.string().trim().min(1).max(120),
            driverName: z.string().trim().max(120).nullish(),
            driverNumber: z.string().trim().min(1).max(40),
            route: z.array(z.string().trim().min(1)).min(2),
            departures: z
              .array(z.object({ time: clock, days: z.array(weekday).min(1) }).strict())
              .min(1),
          })
          .strict(),
      )
      .min(1),
  })
  .strict()
  .superRefine((data, ctx) => {
    const known = new Set(data.stops);
    data.buses.forEach((bus, index) => {
      for (const stop of bus.route) {
        if (!known.has(stop)) {
          ctx.addIssue({
            code: 'custom',
            path: ['buses', index, 'route'],
            message: `"${stop}" is not listed under stops`,
          });
        }
      }
      if (new Set(bus.route).size !== bus.route.length) {
        ctx.addIssue({
          code: 'custom',
          path: ['buses', index, 'route'],
          message: 'A route may visit each stop only once',
        });
      }
    });
  });

/**
 * @param {import('@prisma/client').PrismaClient} prisma
 * @param {unknown} raw Parsed JSON.
 */
export async function loadTransport(prisma, raw) {
  const data = transportFileSchema.parse(raw);

  return prisma.$transaction(async (tx) => {
    const stopIds = new Map();
    for (const name of data.stops) {
      const stop = await tx.busStop.upsert({ where: { name }, create: { name }, update: {} });
      stopIds.set(name, stop.id);
    }

    for (const definition of data.buses) {
      const fields = {
        driverName: definition.driverName ?? null,
        driverNumber: definition.driverNumber,
        active: true,
      };
      const bus = await tx.bus.upsert({
        where: { name: definition.name },
        create: { name: definition.name, ...fields },
        update: fields,
      });

      await tx.routeStop.deleteMany({ where: { busId: bus.id } });
      await tx.routeStop.createMany({
        data: definition.route.map((stopName, position) => ({
          busId: bus.id,
          stopId: stopIds.get(stopName),
          position,
        })),
      });

      await tx.departure.deleteMany({ where: { busId: bus.id } });
      await tx.departure.createMany({
        data: definition.departures.map((departure) => ({
          busId: bus.id,
          departureTime: departure.time,
          daysOfWeek: departure.days,
        })),
      });
    }

    const { count: deactivated } = await tx.bus.updateMany({
      where: { name: { notIn: data.buses.map((bus) => bus.name) }, active: true },
      data: { active: false },
    });

    return { stops: data.stops.length, buses: data.buses.length, deactivated };
  });
}
