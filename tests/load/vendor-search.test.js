import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Rate } from 'k6/metrics';
import {
  PATHS,
  buildOptions,
  getParams,
  parseJson,
  randomFrom,
  thinkTime,
  url,
} from './config.js';

const errorRate = new Rate('error_rate');

export const options = buildOptions('vendor-search-load', 'vendorSearch');

const queries = ['photography', 'catering', 'decor', 'makeup', 'venue'];
const cities = ['Mumbai', 'Bangalore', 'Hyderabad', 'Delhi', 'Pune'];
const categories = ['PHOTOGRAPHY', 'CATERING', 'DECORATION', 'MAKEUP', 'VENUE'];

// Simulates the most common WeddingOS action: searching and refining vendor discovery.
export default function () {
  const query = randomFrom(queries);
  const city = randomFrom(cities);
  const category = randomFrom(categories);

  group('vendor autocomplete', () => {
    const autocompleteUrl = `${url(PATHS.vendorAutocomplete, 'search')}?q=${encodeURIComponent(query.slice(0, 4))}`;
    const response = http.get(autocompleteUrl, getParams());
    const body = parseJson(response);
    const ok = check(response, {
      'autocomplete returned 200': (res) => res.status === 200,
      'autocomplete body shape is valid': () =>
        body?.success === true && Array.isArray(body?.data?.suggestions),
    });

    errorRate.add(!ok);
  });

  group('vendor search', () => {
    const searchUrl = `${url(PATHS.vendorSearch, 'vendor')}?q=${encodeURIComponent(query)}&city=${encodeURIComponent(city)}&category=${encodeURIComponent(category)}&limit=20&page=1`;
    const response = http.get(searchUrl, getParams());
    const body = parseJson(response);
    const ok = check(response, {
      'vendor search returned 200': (res) => res.status === 200,
      'vendor search body shape is valid': () =>
        body?.success === true &&
        Array.isArray(body?.data?.vendors) &&
        typeof body?.data?.total === 'number' &&
        typeof body?.data?.page === 'number' &&
        typeof body?.data?.limit === 'number',
    });

    errorRate.add(!ok);
  });

  sleep(thinkTime(1, 2));
}
