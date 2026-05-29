import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Rate } from 'k6/metrics';
import {
  PATHS,
  buildOptions,
  futureDate,
  jsonParams,
  loginWithOtp,
  parseJson,
  pathFromTemplate,
  syntheticUuid,
  thinkTime,
  url,
} from './config.js';

const errorRate = new Rate('error_rate');

export const options = buildOptions('booking-flow-load', 'bookingFlow');

export function setup() {
  const customerToken =
    __ENV.BOOKING_CUSTOMER_TOKEN ||
    maybeLogin('BOOKING_CUSTOMER_PHONE', 'BOOKING_CUSTOMER_OTP', 'booking-customer');
  const vendorToken =
    __ENV.BOOKING_VENDOR_TOKEN ||
    maybeLogin('BOOKING_VENDOR_PHONE', 'BOOKING_VENDOR_OTP', 'booking-vendor');

  if (!customerToken) {
    throw new Error('Missing BOOKING_CUSTOMER_TOKEN or BOOKING_CUSTOMER_PHONE/BOOKING_CUSTOMER_OTP');
  }
  if (!vendorToken) {
    throw new Error('Missing BOOKING_VENDOR_TOKEN or BOOKING_VENDOR_PHONE/BOOKING_VENDOR_OTP');
  }
  if (!__ENV.BOOKING_VENDOR_ID) {
    throw new Error('Missing BOOKING_VENDOR_ID (booking-service expects the vendor auth user id).');
  }

  return {
    customerToken,
    vendorToken,
    vendorId: __ENV.BOOKING_VENDOR_ID,
    packageId: __ENV.BOOKING_PACKAGE_ID || undefined,
    eventType: __ENV.BOOKING_EVENT_TYPE || 'WEDDING',
    eventCity: __ENV.BOOKING_EVENT_CITY || 'Mumbai',
    quoteAmountPaise: Number(__ENV.BOOKING_QUOTE_AMOUNT_PAISE || 250000),
  };
}

// Covers the core conversion funnel: create enquiry, vendor sends quote, customer accepts quote.
export default function (data) {
  const eventDate = futureDate(45 + ((__ITER + __VU) % 90));
  const enquiryPayload = {
    vendorId: data.vendorId,
    ...(data.packageId ? { packageId: data.packageId } : {}),
    eventDate,
    eventType: data.eventType,
    eventCity: data.eventCity,
    guestCount: 250 + (__ITER % 50),
    requirements: `Load test enquiry ${syntheticUuid(__VU, __ITER, 1)}`,
    specialNotes: 'k6 booking flow load test',
  };

  let bookingId;

  group('booking enquiry', () => {
    const response = http.post(
      url(PATHS.bookingEnquiry, 'booking'),
      JSON.stringify(enquiryPayload),
      jsonParams(data.customerToken),
    );
    const body = parseJson(response);
    const ok = check(response, {
      'enquiry returned 201': (res) => res.status === 201,
      'enquiry body shape is valid': () =>
        body?.success === true &&
        typeof body?.data?.booking?.id === 'string' &&
        body?.data?.booking?.status === 'ENQUIRY',
    });

    bookingId = body?.data?.booking?.id;
    errorRate.add(!ok);
  });

  if (!bookingId) {
    sleep(thinkTime(1, 2));
    return;
  }

  group('booking quote', () => {
    const response = http.post(
      url(pathFromTemplate(PATHS.bookingQuote, { bookingId }), 'booking'),
      JSON.stringify({
        quotedAmountPaise: data.quoteAmountPaise,
        note: 'k6 generated quote',
      }),
      jsonParams(data.vendorToken),
    );
    const body = parseJson(response);
    const ok = check(response, {
      'quote returned 200': (res) => res.status === 200,
      'quote body shape is valid': () =>
        body?.success === true &&
        body?.data?.booking?.id === bookingId &&
        body?.data?.booking?.status === 'QUOTE_SENT',
    });

    errorRate.add(!ok);
  });

  group('booking accept quote', () => {
    const response = http.post(
      url(pathFromTemplate(PATHS.bookingAccept, { bookingId }), 'booking'),
      null,
      jsonParams(data.customerToken),
    );
    const body = parseJson(response);
    const ok = check(response, {
      'accept returned 200': (res) => res.status === 200,
      'accept body shape is valid': () =>
        body?.success === true &&
        body?.data?.booking?.id === bookingId &&
        body?.data?.booking?.status === 'ADVANCE_PENDING',
    });

    errorRate.add(!ok);
  });

  sleep(thinkTime(1, 3));
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
