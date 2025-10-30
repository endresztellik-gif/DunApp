/**
 * Mock HTTP Handlers for Testing
 *
 * Simple fetch mock handlers for testing without MSW dependency.
 * These can be used with vi.stubGlobal('fetch', mockFetch) in tests.
 */

import {
  mockOpenWeatherMapResponse,
  mockMeteoblueResponse,
  mockYrNoResponse,
  mockDroughtSearchResponse,
  mockDroughtStationDataResponse,
  mockVizugyHuHTML,
  mockHydroinfoHuHTML,
  mockApiErrorResponses
} from './api-responses';

export type MockFetchOptions = {
  shouldFail?: boolean;
  statusCode?: number;
  delay?: number;
};

/**
 * Create a mock fetch function for testing
 */
export function createMockFetch(options: MockFetchOptions = {}) {
  const { shouldFail = false, statusCode = 200, delay = 0 } = options;

  return async (url: string | URL | Request, _init?: RequestInit): Promise<Response> => {
    // Add delay if specified
    if (delay > 0) {
      await new Promise(resolve => setTimeout(resolve, delay));
    }

    // Simulate network failure
    if (shouldFail) {
      throw new Error('Network error');
    }

    const urlString = typeof url === 'string' ? url : url.toString();

    // OpenWeatherMap API
    if (urlString.includes('api.openweathermap.org')) {
      return new Response(JSON.stringify(mockOpenWeatherMapResponse), {
        status: statusCode,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Meteoblue API
    if (urlString.includes('meteoblue.com')) {
      return new Response(JSON.stringify(mockMeteoblueResponse), {
        status: statusCode,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Yr.no API
    if (urlString.includes('api.met.no')) {
      return new Response(JSON.stringify(mockYrNoResponse), {
        status: statusCode,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Drought monitoring - search
    if (urlString.includes('aszalymonitoring.vizugy.hu/api/search')) {
      return new Response(JSON.stringify(mockDroughtSearchResponse), {
        status: statusCode,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Drought monitoring - station data
    if (urlString.includes('aszalymonitoring.vizugy.hu/api/station')) {
      return new Response(JSON.stringify(mockDroughtStationDataResponse), {
        status: statusCode,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Water level - vizugy.hu
    if (urlString.includes('vizugy.hu')) {
      return new Response(mockVizugyHuHTML, {
        status: statusCode,
        headers: { 'Content-Type': 'text/html' }
      });
    }

    // Water level forecast - hydroinfo.hu
    if (urlString.includes('hydroinfo.hu')) {
      return new Response(mockHydroinfoHuHTML, {
        status: statusCode,
        headers: { 'Content-Type': 'text/html; charset=ISO-8859-2' }
      });
    }

    // Default - not found
    return new Response(JSON.stringify(mockApiErrorResponses.notFound), {
      status: 404,
      headers: { 'Content-Type': 'application/json' }
    });
  };
}

/**
 * Create mock fetch with specific error
 */
export function createMockFetchWithError(errorType: keyof typeof mockApiErrorResponses) {
  const error = mockApiErrorResponses[errorType];

  return async (_url: string | URL | Request): Promise<Response> => {
    return new Response(JSON.stringify(error), {
      status: error.code,
      headers: { 'Content-Type': 'application/json' }
    });
  };
}

/**
 * Create mock fetch that fails after N attempts
 */
export function createMockFetchWithRetry(failCount: number) {
  let attempts = 0;

  return async (url: string | URL | Request): Promise<Response> => {
    attempts++;

    if (attempts <= failCount) {
      throw new Error('Network error');
    }

    // Success after failCount attempts
    return createMockFetch()(url);
  };
}

/**
 * Mock fetch response builders
 */
export const mockFetchResponses = {
  json: (data: any, status = 200) =>
    new Response(JSON.stringify(data), {
      status,
      headers: { 'Content-Type': 'application/json' }
    }),

  html: (html: string, status = 200) =>
    new Response(html, {
      status,
      headers: { 'Content-Type': 'text/html' }
    }),

  error: (status: number, message: string) =>
    new Response(JSON.stringify({ error: message }), {
      status,
      headers: { 'Content-Type': 'application/json' }
    }),

  networkError: () => Promise.reject(new Error('Network error'))
};
