import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

const geocodingSchema = z.object({
  results: z.array(z.object({
    latitude: z.number(),
    longitude: z.number(),
    name: z.string(),
  })).optional(),
});

const weatherResponseSchema = z.object({
  current: z.object({
    time: z.string(),
    temperature_2m: z.number(),
    apparent_temperature: z.number(),
    relative_humidity_2m: z.number(),
    wind_speed_10m: z.number(),
    wind_gusts_10m: z.number(),
    weather_code: z.number(),
  }),
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

export const weatherTool = createTool({
  id: 'get-weather',
  description: 'Get current weather for a location',
  inputSchema: z.object({
    location: z.string().trim().min(1).max(200).describe('City name'),
  }),
  outputSchema: z.object({
    temperature: z.number(),
    feelsLike: z.number(),
    humidity: z.number(),
    windSpeed: z.number(),
    windGust: z.number(),
    conditions: z.string(),
    location: z.string(),
    observedAt: z.string(),
    timezone: z.literal('UTC'),
    units: z.object({
      temperature: z.literal('°C'),
      humidity: z.literal('%'),
      windSpeed: z.literal('km/h'),
    }),
    sourceUrl: z.url(),
  }),
  execute: async (inputData, context) => {
    return await getWeather(inputData.location, context?.abortSignal);
  },
});

const getWeather = async (location: string, abortSignal?: AbortSignal) => {
  const geocodingUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(location)}&count=1`;
  const geocodingResult = geocodingSchema.safeParse(await fetchJson(geocodingUrl, 'Geocoding', abortSignal));
  if (!geocodingResult.success) {
    throw new Error('Geocoding returned invalid location data');
  }
  const geocodingData = geocodingResult.data;

  if (!geocodingData.results?.[0]) {
    throw new Error(`Location '${location}' not found`);
  }

  const { latitude, longitude, name } = geocodingData.results[0];

  const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,wind_gusts_10m,weather_code&temperature_unit=celsius&wind_speed_unit=kmh&timezone=UTC`;

  const weatherResult = weatherResponseSchema.safeParse(await fetchJson(weatherUrl, 'Weather', abortSignal));
  if (!weatherResult.success) {
    throw new Error('Weather service returned invalid current conditions');
  }
  const data = weatherResult.data;

  return {
    temperature: data.current.temperature_2m,
    feelsLike: data.current.apparent_temperature,
    humidity: data.current.relative_humidity_2m,
    windSpeed: data.current.wind_speed_10m,
    windGust: data.current.wind_gusts_10m,
    conditions: getWeatherCondition(data.current.weather_code),
    location: name,
    observedAt: `${data.current.time}Z`,
    timezone: 'UTC' as const,
    units: { temperature: '°C', humidity: '%', windSpeed: 'km/h' } as const,
    sourceUrl: weatherUrl,
  };
};

function getWeatherCondition(code: number): string {
  const conditions: Record<number, string> = {
    0: 'Clear sky',
    1: 'Mainly clear',
    2: 'Partly cloudy',
    3: 'Overcast',
    45: 'Foggy',
    48: 'Depositing rime fog',
    51: 'Light drizzle',
    53: 'Moderate drizzle',
    55: 'Dense drizzle',
    56: 'Light freezing drizzle',
    57: 'Dense freezing drizzle',
    61: 'Slight rain',
    63: 'Moderate rain',
    65: 'Heavy rain',
    66: 'Light freezing rain',
    67: 'Heavy freezing rain',
    71: 'Slight snow fall',
    73: 'Moderate snow fall',
    75: 'Heavy snow fall',
    77: 'Snow grains',
    80: 'Slight rain showers',
    81: 'Moderate rain showers',
    82: 'Violent rain showers',
    85: 'Slight snow showers',
    86: 'Heavy snow showers',
    95: 'Thunderstorm',
    96: 'Thunderstorm with slight hail',
    99: 'Thunderstorm with heavy hail',
  };
  return conditions[code] || 'Unknown';
}
