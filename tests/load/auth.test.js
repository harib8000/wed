import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Rate } from 'k6/metrics';
import {
  PATHS,
  buildOptions,
  jsonParams,
  parseJson,
  thinkTime,
  uniqueIndianPhone,
  url,
} from './config.js';

const errorRate = new Rate('error_rate');

export const options = buildOptions('auth-load', 'auth');

// Exercises the OTP login journey. In non-production environments,
// configure AUTH_TEST_OTP to a deterministic OTP so the verify step can succeed.
export default function () {
  const phone = uniqueIndianPhone(__VU, __ITER);
  const deviceId = `k6-auth-${__VU}-${__ITER}`;

  group('auth send otp', () => {
    const response = http.post(
      url(PATHS.authSendOtp, 'auth'),
      JSON.stringify({ phone }),
      jsonParams(),
    );
    const body = parseJson(response);
    const ok = check(response, {
      'send otp returned 200': (res) => res.status === 200,
      'send otp body shape is valid': () =>
        body?.success === true &&
        body?.data?.message === 'OTP sent successfully' &&
        typeof body?.data?.expiresInMinutes === 'number',
    });

    errorRate.add(!ok);
  });

  if (!__ENV.AUTH_TEST_OTP) {
    sleep(thinkTime(1, 2));
    return;
  }

  group('auth verify otp', () => {
    const response = http.post(
      url(PATHS.authVerifyOtp, 'auth'),
      JSON.stringify({ phone, otp: __ENV.AUTH_TEST_OTP, deviceId }),
      jsonParams(),
    );
    const body = parseJson(response);
    const ok = check(response, {
      'verify otp returned 200': (res) => res.status === 200,
      'verify otp body shape is valid': () =>
        body?.success === true &&
        typeof body?.data?.accessToken === 'string' &&
        typeof body?.data?.expiresIn === 'number' &&
        typeof body?.data?.user?.id === 'string' &&
        typeof body?.data?.user?.role === 'string',
    });

    errorRate.add(!ok);
  });

  sleep(thinkTime(1, 3));
}
