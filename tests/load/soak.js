import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';
import {
  HEALTH_ENDPOINTS,
  PATHS,
  buildOptions,
  getParams,
  parseJson,
  randomFrom,
  thinkTime,
  url,
} from './config.js';

const errorRate = new Rate('error_rate');

export const options = buildOptions('soak-load', 'soak', {
  summaryTrendStats: ['avg', 'min', 'med', 'p(95)', 'p(99)', 'max'],
  noVUConnectionReuse: false,
});

const queries = ['photography', 'decor', 'mehendi', 'music', 'catering'];
const cities = ['Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai'];

// Long-running low traffic mix used to spot slow memory/resource leaks via latency and error drift.
export default function () {
  const roll = Math.random();

  if (roll < 0.65) {
    const query = randomFrom(queries);
    const city = randomFrom(cities);
    const response = http.get(
      `${url(PATHS.vendorSearch, 'vendor')}?q=${encodeURIComponent(query)}&city=${encodeURIComponent(city)}&limit=12&page=1`,
      getParams(),
    );
    const body = parseJson(response);
    const ok = check(response, {
      'soak vendor search returned 200': (res) => res.status === 200,
      'soak vendor search body shape is valid': () => body?.success === true && Array.isArray(body?.data?.vendors),
    });
    errorRate.add(!ok);
  } else if (roll < 0.9) {
    const query = randomFrom(queries).slice(0, 4);
    const response = http.get(
      `${url(PATHS.vendorAutocomplete, 'search')}?q=${encodeURIComponent(query)}`,
      getParams(),
    );
    const body = parseJson(response);
    const ok = check(response, {
      'soak autocomplete returned 200': (res) => res.status === 200,
      'soak autocomplete body shape is valid': () => body?.success === true && Array.isArray(body?.data?.suggestions),
    });
    errorRate.add(!ok);
  } else {
    const health = randomFrom(HEALTH_ENDPOINTS);
    const response = http.get(url(health.path, health.service), getParams());
    const body = parseJson(response);
    const ok = check(response, {
      'soak health returned 200': (res) => res.status === 200,
      'soak health body shape is valid': () => body?.status === 'ok' || body?.status === 'healthy',
    });
    errorRate.add(!ok);
  }

  sleep(thinkTime(1, 4));
}
