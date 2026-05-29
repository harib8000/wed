# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: accessibility.spec.ts >> Basic accessibility checks >> auth and enquiry forms expose labels
- Location: e2e/accessibility.spec.ts:74:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByLabel('Mobile Number')
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByLabel('Mobile Number')

```

```yaml
- link "W Wedding OS":
  - /url: /
- paragraph: India's Wedding Operating System
- link "All login options":
  - /url: /login
  - img
  - text: All login options
- img
- heading "Couple Sign In" [level=1]
- paragraph: Plan your dream wedding with verified vendors
- img
- text: Couple Login Mobile Number +91
- textbox "9876543210"
- button "Get OTP →" [disabled]
- paragraph:
  - text: By continuing, you agree to our
  - link "Terms":
    - /url: /terms
  - text: "&"
  - link "Privacy Policy":
    - /url: /privacy
- text: Quick Demo Access
- button "Try Demo Couple Account":
  - img
  - text: Try Demo Couple Account
  - img
- img
- text: Secured with 256-bit encryption
- link "Vendor Login":
  - /url: /login/vendor
- text: ·
- link "Coordinator Login":
  - /url: /login/coordinator
- text: ·
- link "Admin Login":
  - /url: /login/admin
- alert
```

# Test source

```ts
  1  | import { expect, test } from '@playwright/test';
  2  | 
  3  | const CONSENT_KEY = 'weddingos_cookie_consent';
  4  | 
  5  | async function preparePage(page: import('@playwright/test').Page) {
  6  |   await page.addInitScript((key: string) => {
  7  |     localStorage.setItem(
  8  |       key,
  9  |       JSON.stringify({
  10 |         mode: 'all',
  11 |         essential: true,
  12 |         analytics: true,
  13 |         personalization: true,
  14 |         marketing: true,
  15 |         updatedAt: '2026-01-01T00:00:00.000Z',
  16 |       }),
  17 |     );
  18 |   }, CONSENT_KEY);
  19 | }
  20 | 
  21 | const MOCK_VENDORS = [
  22 |   {
  23 |     id: 'vendor-1',
  24 |     businessName: 'Royal Grand Palace',
  25 |     category: 'venue',
  26 |     city: 'Hyderabad',
  27 |     citiesServed: ['Hyderabad'],
  28 |     rating: 4.9,
  29 |     totalReviews: 247,
  30 |     totalBookings: 312,
  31 |     basePrice: 500000,
  32 |     coverImage: 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=400&q=80',
  33 |     verificationStatus: 'verified',
  34 |     featured: true,
  35 |     responseTimeHours: 2,
  36 |     yearsExperience: 12,
  37 |     teamSize: 50,
  38 |     cancellationRate: 1.4,
  39 |     eventTypes: ['Wedding', 'Reception'],
  40 |     latitude: 17.385,
  41 |     longitude: 78.4867,
  42 |   },
  43 | ];
  44 | 
  45 | test.describe('Basic accessibility checks', () => {
  46 |   test('core pages expose a visible primary heading', async ({ page }) => {
  47 |     await preparePage(page);
  48 | 
  49 |     for (const path of ['/', '/login/couple', '/privacy']) {
  50 |       await page.goto(path);
  51 |       await expect(page.locator('h1').first()).toBeVisible();
  52 |     }
  53 |   });
  54 | 
  55 |   test('vendor browsing pages provide alt text for images', async ({ page }) => {
  56 |     await preparePage(page);
  57 |     await page.route('**/api/search/vendors**', async (route) => {
  58 |       await route.fulfill({
  59 |         status: 200,
  60 |         contentType: 'application/json',
  61 |         body: JSON.stringify({ data: { vendors: MOCK_VENDORS } }),
  62 |       });
  63 |     });
  64 | 
  65 |     await page.goto('/vendors');
  66 |     await expect(page.locator('img:not([alt])')).toHaveCount(0);
  67 |     await expect(page.locator('img[alt]').first()).toBeVisible();
  68 | 
  69 |     await page.goto('/vendors/vendor-1');
  70 |     await expect(page.locator('img:not([alt])')).toHaveCount(0);
  71 |     await expect(page.locator('img[alt]').first()).toBeVisible();
  72 |   });
  73 | 
  74 |   test('auth and enquiry forms expose labels', async ({ page }) => {
  75 |     await preparePage(page);
  76 |     await page.route('**/api/auth/send-otp', async (route) => {
  77 |       await route.fulfill({
  78 |         status: 200,
  79 |         contentType: 'application/json',
  80 |         body: JSON.stringify({ data: { success: true } }),
  81 |       });
  82 |     });
  83 | 
  84 |     await page.goto('/login/couple');
> 85 |     await expect(page.getByLabel('Mobile Number')).toBeVisible();
     |                                                    ^ Error: expect(locator).toBeVisible() failed
  86 | 
  87 |     await page.getByLabel('Mobile Number').fill('9876543210');
  88 |     await page.getByRole('button', { name: /Get OTP/i }).click();
  89 |     await expect(page.getByLabel('6-Digit OTP')).toBeVisible();
  90 | 
  91 |     await page.goto('/vendors/vendor-1');
  92 |     await page.getByRole('button', { name: /Quick Enquiry/i }).first().click();
  93 |     await expect(page.getByLabel('Event Date')).toBeVisible();
  94 |     await expect(page.getByLabel('Expected Guests')).toBeVisible();
  95 |     await expect(page.getByLabel(/Message/i)).toBeVisible();
  96 |   });
  97 | });
  98 | 
```