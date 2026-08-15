import { z } from 'zod';

import * as service from './service.js';
import {
  busResponseSchema,
  departureResponseSchema,
  searchDeparturesQuerySchema,
  stopResponseSchema,
} from './schema.js';

/// Read-only. Campus buses are not booked — see the note in service.js.
export default async function transportRoutes(app) {
  app.addHook('onRequest', app.requireAuth);

  app.get(
    '/stops',
    { schema: { response: { 200: z.array(stopResponseSchema) } } },
    async () => service.listStops(app),
  );

  app.get(
    '/buses',
    { schema: { response: { 200: z.array(busResponseSchema) } } },
    async () => service.listBuses(app),
  );

  app.get(
    '/departures',
    {
      schema: {
        querystring: searchDeparturesQuerySchema,
        response: { 200: z.array(departureResponseSchema) },
      },
    },
    async (request) => service.searchDepartures(app, request.query),
  );
}
