import { expect, test } from '@playwright/test';

const CONSENT_KEY = 'weddingos_cookie_consent';

const MOCK_BOOKING = {
  id: 'b1',
  bookingNumber: 'WOS-001',
  status: 'CONFIRMED',
  eventDate: '2026-12-21',
  eventType: 'WEDDING',
  eventCity: 'Hyderabad',
  guestCount: 400,
  vendorId: 'vendor-1',
  vendorName: 'Royal Grand Palace',
  vendorCategory: 'Venue',
  vendorImage: 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=800&q=80',
  vendorPhone: '+91 98765 43210',
  packageName: 'Grand Gold',
  quotedAmountPaise: 90000000,
  finalAmountPaise: 90000000,
  advanceAmountPaise: 27000000,
  platformFeePaise: 4500000,
  vendorQuoteNote: 'Includes decor, stage, valet parking, and bridal suite.',
  createdAt: '2026-01-01T09:00:00.000Z',
  events: [
    { eventType: 'ENQUIRY_CREATED', actorRole: 'customer', payload: {}, createdAt: '2026-01-01T09:00:00.000Z' },
    { eventType: 'QUOTE_SENT', actorRole: 'vendor', payload: {}, createdAt: '2026-01-02T09:00:00.000Z' },
    { eventType: 'CONFIRMED', actorRole: 'system', payload: {}, createdAt: '2026-01-03T09:00:00.000Z' },
  ],
};

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

test.describe('Booking flow', () => {
  test('quick enquiry form is accessible and required fields are validated', async ({ page }) => {
    await preparePage(page);
    await page.setViewportSize({ width: 375, height: 812 });

    await page.goto('/vendors/vendor-1');

    await expect(page).toHaveTitle(/Wedding OS/i);
    await page.getByRole('button', { name: /Quick Enquiry/i }).first().click();

    await expect(page.getByRole('heading', { name: 'Quick Enquiry' })).toBeVisible();
    await expect(page.getByLabel('Event Date')).toHaveAttribute('required', '');
    await expect(page.getByLabel('Expected Guests')).toHaveAttribute('required', '');
    await expect(page.getByLabel(/Message/i)).toBeVisible();

    await page.getByRole('button', { name: /Send Enquiry/i }).click();
    await expect(page.locator('input:invalid')).toHaveCount(2);
  });

  test('booking detail page shows escrow and payment structure', async ({ page }) => {
    await preparePage(page);
    await page.addInitScript(() => {
      localStorage.setItem('access_token', 'booking-test-token');
    });
    await page.route('**/api/bookings/b1', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: { booking: MOCK_BOOKING } }),
      });
    });

    await page.goto('/bookings/b1');

    await expect(page).toHaveTitle(/Wedding OS/i);
    await expect(page.getByRole('heading', { name: 'Royal Grand Palace' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Escrow Protection Timeline' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Payment Summary' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Event Details' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Activity' })).toBeVisible();
    await expect(page.getByRole('link', { name: /Message Vendor/i })).toBeVisible();
  });
});
