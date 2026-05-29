import { expect, test } from '@playwright/test';

const CONSENT_KEY = 'weddingos_cookie_consent';

async function preparePage(page: import('@playwright/test').Page) {
  await page.addInitScript((key: string) => {
    localStorage.setItem(
      key,
      JSON.stringify({
        mode: 'all',
        essential: true,
        analytics: true,
        personalization: true,
        marketing: true,
        updatedAt: '2026-01-01T00:00:00.000Z',
      }),
    );
  }, CONSENT_KEY);
}

const MOCK_VENDORS = [
  {
    id: 'vendor-1',
    businessName: 'Royal Grand Palace',
    category: 'venue',
    city: 'Hyderabad',
    citiesServed: ['Hyderabad'],
    rating: 4.9,
    totalReviews: 247,
    totalBookings: 312,
    basePrice: 500000,
    coverImage: 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=400&q=80',
    verificationStatus: 'verified',
    featured: true,
    responseTimeHours: 2,
    yearsExperience: 12,
    teamSize: 50,
    cancellationRate: 1.4,
    eventTypes: ['Wedding', 'Reception'],
    latitude: 17.385,
    longitude: 78.4867,
  },
];

test.describe('Basic accessibility checks', () => {
  test('core pages expose a visible primary heading', async ({ page }) => {
    await preparePage(page);

    for (const path of ['/', '/login/couple', '/privacy']) {
      await page.goto(path);
      await expect(page.locator('h1').first()).toBeVisible();
    }
  });

  test('vendor browsing pages provide alt text for images', async ({ page }) => {
    await preparePage(page);
    await page.route('**/api/search/vendors**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: { vendors: MOCK_VENDORS } }),
      });
    });

    await page.goto('/vendors');
    await expect(page.locator('img:not([alt])')).toHaveCount(0);
    await expect(page.locator('img[alt]').first()).toBeVisible();

    await page.goto('/vendors/vendor-1');
    await expect(page.locator('img:not([alt])')).toHaveCount(0);
    await expect(page.locator('img[alt]').first()).toBeVisible();
  });

  test('auth and enquiry forms expose labels', async ({ page }) => {
    await preparePage(page);
    await page.route('**/api/auth/send-otp', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: { success: true } }),
      });
    });

    await page.goto('/login/couple');
    await expect(page.getByPlaceholder('9876543210')).toBeVisible();

    await page.getByPlaceholder('9876543210').fill('9876543210');
    await page.getByRole('button', { name: /Get OTP/i }).click();
    await expect(page.getByPlaceholder('• • • • • •')).toBeVisible();

    await page.goto('/vendors/vendor-1');
    await page.getByRole('button', { name: /Quick Enquiry/i }).first().click();
    await expect(page.getByLabel('Event Date')).toBeVisible();
    await expect(page.getByLabel('Expected Guests')).toBeVisible();
    await expect(page.getByLabel(/Message/i)).toBeVisible();
  });
});
