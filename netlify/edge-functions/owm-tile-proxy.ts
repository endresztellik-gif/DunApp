/**
 * Netlify Edge Function: OWM Tile Proxy
 *
 * Proxies OpenWeatherMap tile requests server-side so the API key
 * is never exposed to the browser.
 *
 * Usage: /owm-tiles/{layer}/{z}/{x}/{y}.png
 * Example: /owm-tiles/wind_new/7/72/45.png
 */

import type { Context } from 'https://edge.netlify.com';

export default async (request: Request, context: Context) => {
  // Extract the path suffix from the URL (more reliable than context.params['*'])
  const url = new URL(request.url);
  const pathSuffix = url.pathname.replace('/owm-tiles/', ''); // e.g. "wind_new/7/72/45.png"

  if (!pathSuffix || pathSuffix === url.pathname) {
    return new Response('Missing tile path', { status: 400 });
  }

  const apiKey = Deno.env.get('OPENWEATHER_API_KEY');
  if (!apiKey) {
    return new Response('API key not configured', { status: 503 });
  }

  const tileUrl = `https://tile.openweathermap.org/map/${pathSuffix}?appid=${apiKey}`;

  const response = await fetch(tileUrl, {
    headers: { 'User-Agent': 'DunApp PWA/2.8 (contact@dunapp.hu)' },
  });

  if (!response.ok) {
    return new Response('Tile unavailable', { status: response.status });
  }

  return new Response(response.body, {
    status: 200,
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=3600',
      'Access-Control-Allow-Origin': '*',
    },
  });
};

export const config = { path: '/owm-tiles/*' };
