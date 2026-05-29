import http from 'k6/http';

export const BASE_URL = sanitizeBaseUrl(__ENV.BASE_URL || 'http://localhost:8000');
export const API_PREFIX = sanitizePrefix(__ENV.API_PREFIX || '');
export const REQUEST_TIMEOUT = __ENV.REQUEST_TIMEOUT || '30s';

const SERVICE_BASE_ENV = {
  auth: 'AUTH_BASE_URL',
  user: 'USER_BASE_URL',
  vendor: 'VENDOR_BASE_URL',
  booking: 'BOOKING_BASE_URL',
  payment: 'PAYMENT_BASE_URL',
  review: 'REVIEW_BASE_URL',
  notification: 'NOTIFICATION_BASE_URL',
  execution: 'EXECUTION_BASE_URL',
  search: 'SEARCH_BASE_URL',
  chat: 'CHAT_BASE_URL',
  media: 'MEDIA_BASE_URL',
  ai: 'AI_BASE_URL',
};

export const PATHS = {
  authSendOtp: __ENV.AUTH_SEND_OTP_PATH || '/auth/send-otp',
  authVerifyOtp: __ENV.AUTH_VERIFY_OTP_PATH || '/auth/verify-otp',
  vendorSearch: __ENV.VENDOR_SEARCH_PATH || '/vendors/search',
  vendorAutocomplete: __ENV.VENDOR_AUTOCOMPLETE_PATH || '/search/autocomplete',
  bookingEnquiry: __ENV.BOOKING_ENQUIRY_PATH || '/bookings',
  bookingQuote: __ENV.BOOKING_QUOTE_PATH_TEMPLATE || '/bookings/{bookingId}/quote',
  bookingAccept: __ENV.BOOKING_ACCEPT_PATH_TEMPLATE || '/bookings/{bookingId}/accept-quote',
  paymentCreateOrder: __ENV.PAYMENT_ORDER_PATH || '/payments/order',
};

export const HEALTH_ENDPOINTS = [
  { service: 'auth', path: __ENV.AUTH_HEALTH_PATH || '/auth/health' },
  { service: 'user', path: __ENV.USER_HEALTH_PATH || '/users/health' },
  { service: 'vendor', path: __ENV.VENDOR_HEALTH_PATH || '/vendors/health' },
  { service: 'booking', path: __ENV.BOOKING_HEALTH_PATH || '/bookings/health' },
  { service: 'payment', path: __ENV.PAYMENT_HEALTH_PATH || '/payments/health' },
  { service: 'review', path: __ENV.REVIEW_HEALTH_PATH || '/reviews/health' },
  { service: 'notification', path: __ENV.NOTIFICATION_HEALTH_PATH || '/notifications/health' },
  { service: 'execution', path: __ENV.EXECUTION_HEALTH_PATH || '/execution/health' },
  { service: 'search', path: __ENV.SEARCH_HEALTH_PATH || '/search/health' },
  { service: 'chat', path: __ENV.CHAT_HEALTH_PATH || '/chat/health' },
  { service: 'media', path: __ENV.MEDIA_HEALTH_PATH || '/media/health' },
  { service: 'ai', path: __ENV.AI_HEALTH_PATH || '/health' },
];

export const DEFAULT_THRESHOLDS = {
  http_req_duration: ['p(95)<500'],
  http_req_failed: ['rate<0.01'],
  error_rate: ['rate<0.01'],
  checks: ['rate>0.99'],
};

export const STAGES = {
  auth: [
    { duration: '1m', target: 100 },
    { duration: '3m', target: 100 },
    { duration: '1m', target: 0 },
  ],
  vendorSearch: [
    { duration: '2m', target: 200 },
    { duration: '6m', target: 200 },
    { duration: '2m', target: 0 },
  ],
  bookingFlow: [
    { duration: '1m', target: 50 },
    { duration: '3m', target: 50 },
    { duration: '1m', target: 0 },
  ],
  payment: [
    { duration: '30s', target: 30 },
    { duration: '2m', target: 30 },
    { duration: '30s', target: 0 },
  ],
  smoke: [
    { duration: '10s', target: 1 },
    { duration: '10s', target: 1 },
    { duration: '10s', target: 0 },
  ],
  soak: [
    { duration: '10m', target: 20 },
    { duration: '40m', target: 20 },
    { duration: '10m', target: 0 },
  ],
};

export function buildOptions(name, stagePreset, extra = {}) {
  return {
    tags: { suite: name },
    stages: STAGES[stagePreset],
    thresholds: { ...DEFAULT_THRESHOLDS, ...(extra.thresholds || {}) },
    ...(extra.summaryTrendStats ? { summaryTrendStats: extra.summaryTrendStats } : {}),
    ...(extra.noVUConnectionReuse !== undefined ? { noVUConnectionReuse: extra.noVUConnectionReuse } : {}),
  };
}

export function url(path, service) {
  return `${baseUrlForService(service)}${prefixPath(path)}`;
}

export function baseUrlForService(service) {
  const envName = service ? SERVICE_BASE_ENV[service] : undefined;
  const candidate = envName ? __ENV[envName] : undefined;
  return sanitizeBaseUrl(candidate || BASE_URL);
}

export function prefixPath(path) {
  const normalized = normalizePath(path);
  if (!API_PREFIX || normalized === API_PREFIX || normalized.startsWith(`${API_PREFIX}/`)) {
    return normalized;
  }
  return `${API_PREFIX}${normalized}`;
}

export function pathFromTemplate(template, values) {
  return Object.entries(values).reduce(
    (built, [key, value]) => built.replaceAll(`{${key}}`, String(value)),
    template,
  );
}

export function jsonParams(token, extraHeaders = {}) {
  return {
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...(token ? { Authorization: 'Bearer ' + token } : {}),
      ...extraHeaders,
    },
    timeout: REQUEST_TIMEOUT,
  };
}

export function getParams(token, extraHeaders = {}) {
  return {
    headers: {
      Accept: 'application/json',
      ...(token ? { Authorization: 'Bearer ' + token } : {}),
      ...extraHeaders,
    },
    timeout: REQUEST_TIMEOUT,
  };
}

export function parseJson(response) {
  try {
    return response.json();
  } catch {
    return null;
  }
}

export function randomFrom(items) {
  return items[Math.floor(Math.random() * items.length)];
}

export function thinkTime(minSeconds = 1, maxSeconds = 3) {
  return minSeconds + Math.random() * (maxSeconds - minSeconds);
}

export function uniqueIndianPhone(vu, iter) {
  const serial = String((vu * 100000 + iter) % 1000000000).padStart(9, '0');
  return `+919${serial}`;
}

export function futureDate(daysAhead = 60) {
  const date = new Date();
  date.setDate(date.getDate() + daysAhead);
  return date.toISOString().slice(0, 10);
}

export function syntheticUuid(vu, iter, salt = 0) {
  const seed = (BigInt(Date.now()) + BigInt(vu) * 100000n + BigInt(iter) * 97n + BigInt(salt)).toString(16).padStart(32, '0').slice(-32);
  return `${seed.slice(0, 8)}-${seed.slice(8, 12)}-4${seed.slice(13, 16)}-a${seed.slice(17, 20)}-${seed.slice(20, 32)}`;
}

export function loginWithOtp({ phone, otp, deviceId = 'k6-load', service = 'auth' }) {
  const response = http.post(
    url(PATHS.authVerifyOtp, service),
    JSON.stringify({ phone, otp, deviceId }),
    jsonParams(),
  );
  const body = parseJson(response);
  return {
    response,
    body,
    token: body?.data?.accessToken || null,
    user: body?.data?.user || null,
  };
}

function sanitizeBaseUrl(value) {
  return String(value || '').replace(/\/+$/, '');
}

function sanitizePrefix(value) {
  if (!value) return '';
  const withLeadingSlash = value.startsWith('/') ? value : `/${value}`;
  return withLeadingSlash.replace(/\/+$/, '');
}

function normalizePath(path) {
  if (!path) return '/';
  return path.startsWith('/') ? path : `/${path}`;
}
