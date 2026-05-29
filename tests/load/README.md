# WeddingOS k6 load tests

## Prerequisites
- Install [k6](https://k6.io/docs/get-started/installation/)
- Start the WeddingOS services or API gateway
- From the repo root, run scripts with `pnpm --dir tests/load run <script>`

## Core environment variables
- `BASE_URL` — base host, default `http://localhost:8000`
- `API_PREFIX` — optional shared prefix such as `/api/v1`
- `REQUEST_TIMEOUT` — optional request timeout, default `30s`

## Test data variables
### Auth
- `AUTH_TEST_OTP` — deterministic OTP for non-prod runs. Required for a full send+verify pass.
- Optional path overrides: `AUTH_SEND_OTP_PATH`, `AUTH_VERIFY_OTP_PATH`

### Vendor search
- Optional path overrides: `VENDOR_SEARCH_PATH` (default `/vendors/search`), `VENDOR_AUTOCOMPLETE_PATH` (default `/search/autocomplete`)

### Booking flow
- `BOOKING_VENDOR_ID` — vendor auth user id used by booking-service
- Either `BOOKING_CUSTOMER_TOKEN` or `BOOKING_CUSTOMER_PHONE` + `BOOKING_CUSTOMER_OTP`
- Either `BOOKING_VENDOR_TOKEN` or `BOOKING_VENDOR_PHONE` + `BOOKING_VENDOR_OTP`
- Optional: `BOOKING_PACKAGE_ID`, `BOOKING_EVENT_TYPE`, `BOOKING_EVENT_CITY`, `BOOKING_QUOTE_AMOUNT_PAISE`
- Optional path overrides: `BOOKING_ENQUIRY_PATH`, `BOOKING_QUOTE_PATH_TEMPLATE`, `BOOKING_ACCEPT_PATH_TEMPLATE`

### Payment
- Either `PAYMENT_CUSTOMER_TOKEN` or `PAYMENT_CUSTOMER_PHONE` + `PAYMENT_CUSTOMER_OTP`
- Optional: `PAYMENT_VENDOR_ID`, `PAYMENT_AMOUNT_PAISE`, `PAYMENT_EVENT_DATE`, `PAYMENT_ORDER_PATH`

## Service-specific base URLs
If services are not behind one gateway, override individual bases as needed:
`AUTH_BASE_URL`, `USER_BASE_URL`, `VENDOR_BASE_URL`, `BOOKING_BASE_URL`, `PAYMENT_BASE_URL`, `REVIEW_BASE_URL`, `NOTIFICATION_BASE_URL`, `EXECUTION_BASE_URL`, `SEARCH_BASE_URL`, `CHAT_BASE_URL`, `MEDIA_BASE_URL`, `AI_BASE_URL`

## Commands
```bash
pnpm --dir tests/load run smoke
pnpm --dir tests/load run auth
pnpm --dir tests/load run vendor-search
pnpm --dir tests/load run booking-flow
pnpm --dir tests/load run payment
pnpm --dir tests/load run soak
```

## Example
```bash
BASE_URL=http://localhost:8000 \
API_PREFIX=/api/v1 \
AUTH_TEST_OTP=123456 \
pnpm --dir tests/load run auth
```

## Notes
- All scripts enforce `p(95)<500ms` and `error_rate<0.01`
- Booking and payment tests need valid auth plus UUID-shaped test ids
- WeddingOS currently serves autocomplete at `/search/autocomplete`, booking enquiry at `/bookings`, quote/accept via booking-specific POST routes, and payment order creation at `/payments/order`; override paths if your gateway exposes aliases
