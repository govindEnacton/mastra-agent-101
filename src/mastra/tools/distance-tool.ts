import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

const geocodingSchema = z.object({
  results: z.array(z.object({
    latitude: z.number(),
    longitude: z.number(),
    name: z.string(),
  })).optional(),
});

const osrmResponseSchema = z.object({
  code: z.string(),
  routes: z.array(z.object({
    distance: z.number(),
    duration: z.number(),
  })).optional(),
  waypoints: z.array(z.object({
    name: z.string(),
    location: z.array(z.number()),
  })).optional(),
});

async function fetchJson(url: string, service: string, abortSignal?: AbortSignal) {
  const timeout = AbortSignal.timeout(10_000);
  const response = await fetch(url, {
    signal: abortSignal ? AbortSignal.any([abortSignal, timeout]) : timeout,
  });
  if (!response.ok) {
    throw new Error(`${service} request failed (${response.status})`);
  }
  return response.json();
}

export const distanceTool = createTool({
  id: 'get-distance',
  description:
    'Get the driving distance and travel time between two places. ' +
    'Use for questions like "how far is X from Y", "how long to drive from X to Y", ' +
    'or "what is the distance between these two cities".',
  inputSchema: z.object({
    from: z.string().trim().min(1).max(200).describe('Origin city or place name'),
    to: z.string().trim().min(1).max(200).describe('Destination city or place name'),
  }),
  outputSchema: z.object({
    distanceKm: z.number(),
    durationMinutes: z.number(),
    origin: z.string(),
    destination: z.string(),
    travelMode: z.literal('driving'),
    sourceUrl: z.url(),
  }),
  execute: async (inputData, context) => {
    return await getDistance(inputData.from, inputData.to, context?.abortSignal);
  },
});

const geocode = async (place: string, abortSignal?: AbortSignal) => {
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(place)}&count=1`;
  const result = geocodingSchema.safeParse(await fetchJson(url, 'Geocoding', abortSignal));
  if (!result.success) {
    throw new Error('Geocoding returned invalid location data');
  }
  const match = result.data.results?.[0];
  if (!match) {
    throw new Error(`Location '${place}' not found`);
  }
  return match;
};

const getDistance = async (from: string, to: string, abortSignal?: AbortSignal) => {
  const origin = await geocode(from, abortSignal);
  const destination = await geocode(to, abortSignal);

  const coordinates = `${origin.longitude},${origin.latitude};${destination.longitude},${destination.latitude}`;
  const routeUrl = `https://router.project-osrm.org/route/v1/driving/${coordinates}?overview=false`;

  const routeResult = osrmResponseSchema.safeParse(await fetchJson(routeUrl, 'Routing', abortSignal));
  if (!routeResult.success) {
    throw new Error('Routing service returned invalid route data');
  }

  const data = routeResult.data;
  if (data.code !== 'Ok' || !data.routes?.[0]) {
    throw new Error(`No driving route found between '${from}' and '${to}'`);
  }

  return {
    distanceKm: Number((data.routes[0].distance / 1000).toFixed(1)),
    durationMinutes: Math.round(data.routes[0].duration / 60),
    origin: origin.name,
    destination: destination.name,
    travelMode: 'driving' as const,
    sourceUrl: routeUrl,
  };
};
