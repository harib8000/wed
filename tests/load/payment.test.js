import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';
import {
  PATHS,
  buildOptions,
  futureDate,
  jsonParams,
  loginWithOtp,
  parseJson,
  syntheticUuid,
  thinkTime,
  url,
} from './config.js';

const errorRate = new Rate('error_rate');

export const options = buildOptions('payment-load', 'payment');

export function setup() {
  const customerToken =
    __ENV.PAYMENT_CUSTOMER_TOKEN ||
    maybeLogin('PAYMENT_CUSTOMER_PHONE', 'PAYMENT_CUSTOMER_OTP', 'payment-customer');

  if (!customerToken) {
    throw new Error('Missing PAYMENT_CUSTOMER_TOKEN or PAYMENT_CUSTOMER_PHONE/PAYMENT_CUSTOMER_OTP');
  }

  return {
    customerToken,
    vendorId: __ENV.PAYMENT_VENDOR_ID || __ENV.BOOKING_VENDOR_ID || syntheticUuid(0, 0, 7),
    amountPaise: Number(__ENV.PAYMENT_AMOUNT_PAISE || 750000),
    eventDate: __ENV.PAYMENT_EVENT_DATE || futureDate(60),
  };
}

// Exercises payment order creation, the latency-sensitive escrow handoff before checkout.
export default function (data) {
  const payload = {
    bookingId: syntheticUuid(__VU, __ITER, 11),
    amountPaise: data.amountPaise,
    vendorId: data.vendorId,
    eventDate: data.eventDate,
  };

  const response = http.post(
    url(PATHS.paymentCreateOrder, 'payment'),
    JSON.stringify(payload),
    jsonParams(data.customerToken),
  );
  const body = parseJson(response);
  const ok = check(response, {
    'payment order returned 201': (res) => res.status === 201,
    'payment order body shape is valid': () =>
      body?.success === true &&
      typeof body?.data?.order?.id === 'string' &&
      typeof body?.data?.order?.razorpayOrderId === 'string' &&
      typeof body?.data?.order?.razorpayKeyId === 'string',
  });

  errorRate.add(!ok);
  sleep(thinkTime(1, 2));
}

function maybeLogin(phoneEnv, otpEnv, devicePrefix) {
  const phone = __ENV[phoneEnv];
  const otp = __ENV[otpEnv];
  if (!phone || !otp) return null;

  const { response, token } = loginWithOtp({
    phone,
    otp,
    deviceId: `${devicePrefix}-${Date.now()}`,
  });

  if (response.status !== 200 || !token) {
    throw new Error(`Failed to obtain token for ${phoneEnv}`);
  }

  return token;
}
