import { afterEach, test } from 'node:test';
import assert from 'node:assert/strict';
import { noopObserve } from '@mastra/core/tools';
import { weatherTool } from '../src/mastra/tools/weather-tool';

const location = { results: [{ name: 'London', latitude: 51.5, longitude: -0.12 }] };
const conditions = {
  current: {
    time: '2026-09-29T10:00', temperature_2m: 18, apparent_temperature: 17,
    relative_humidity_2m: 60, wind_speed_10m: 12, wind_gusts_10m: 20, weather_code: 3,
  },
};

const originalFetch = globalThis.fetch;
const context = { observe: noopObserve };
afterEach(() => { globalThis.fetch = originalFetch; });

test('weather tool preserves measurements, units, observation time, and source', async () => {
  const urls: string[] = [];
  globalThis.fetch = async (url, options) => {
    urls.push(String(url));
    assert.ok(options?.signal);
    return Response.json(urls.length === 1 ? location : conditions);
  };

  const result = await weatherTool.execute!({ location: 'London' }, context);
  assert.deepEqual(result, {
    temperature: 18, feelsLike: 17, humidity: 60, windSpeed: 12, windGust: 20,
    conditions: 'Overcast', location: 'London', observedAt: '2026-09-29T10:00Z',
    timezone: 'UTC', units: { temperature: '°C', humidity: '%', windSpeed: 'km/h' },
    sourceUrl: urls[1],
  });
  assert.equal(new URL(urls[1]).searchParams.get('timezone'), 'UTC');
  assert.equal(new URL(urls[1]).searchParams.get('temperature_unit'), 'celsius');
});

test('weather tool reports geocoding HTTP errors before trying to parse a body', async () => {
  globalThis.fetch = async () => new Response('Unavailable', { status: 503 });
  await assert.rejects(() => weatherTool.execute!({ location: 'London' }, context), /Geocoding request failed \(503\)/);
});

test('weather tool distinguishes unknown locations from malformed upstream data', async () => {
  globalThis.fetch = async () => Response.json({ results: [] });
  await assert.rejects(() => weatherTool.execute!({ location: 'Nowhere' }, context), /not found/);
  globalThis.fetch = async () => Response.json({ results: [{ latitude: 'wrong' }] });
  await assert.rejects(() => weatherTool.execute!({ location: 'London' }, context), /invalid location data/);
});

test('weather tool rejects incomplete measurements rather than inventing data', async () => {
  let calls = 0;
  globalThis.fetch = async () => Response.json(++calls === 1 ? location : { current: {} });
  await assert.rejects(() => weatherTool.execute!({ location: 'London' }, context), /invalid current conditions/);
});
