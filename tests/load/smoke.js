import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';
import { HEALTH_ENDPOINTS, buildOptions, getParams, parseJson, url } from './config.js';

const errorRate = new Rate('error_rate');

export const options = buildOptions('smoke-load', 'smoke', {
  summaryTrendStats: ['avg', 'min', 'med', 'p(95)', 'max'],
});

// CI gate: verifies that every service health endpoint responds quickly and with a valid status payload.
export default function () {
  const responses = http.batch(
    HEALTH_ENDPOINTS.map((endpoint) => ['GET', url(endpoint.path, endpoint.service), null, getParams()]),
  );

  responses.forEach((response, index) => {
    const endpoint = HEALTH_ENDPOINTS[index];
    const body = parseJson(response);
    const ok = check(response, {
      [`${endpoint.service} health returned 200`]: (res) => res.status === 200,
      [`${endpoint.service} health body shape is valid`]: () =>
        body?.status === 'ok' || body?.status === 'healthy',
    });

    errorRate.add(!ok);
  });

  sleep(1);
}
