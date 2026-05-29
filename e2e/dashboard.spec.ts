import { expect, test } from '@playwright/test';

const CONSENT_KEY = 'weddingos_cookie_consent';
const VIEWPORTS = [
  { name: 'desktop', width: 1280, height: 900 },
  { name: 'mobile', width: 375, height: 812 },
] as const;

const MOCK_USER = {
  id: 'user-1',
  phone: '+919876543210',
  role: 'customer',
  status: 'active',
  phoneVerified: true,
  weddingDate: '2027-02-14T00:00:00.000Z',
  estimatedBudgetPaise: 250000000,
};

async function seedConsent(page: import('@playwright/test').Page) {
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

test.describe('Dashboard', () => {
  test('protected dashboard redirects unauthenticated visitors', async ({ page }) => {
    await seedConsent(page);

    await page.goto('/dashboard');

    await page.waitForURL('**/login');
    await expect(page).toHaveTitle(/Wedding OS/i);
    await expect(page.getByRole('heading', { name: 'Welcome!' })).toBeVisible();
  });

  for (const viewport of VIEWPORTS) {
    test(`authenticated dashboard layout renders on ${viewport.name}`, async ({ page }) => {
      await seedConsent(page);
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.addInitScript(() => {
        localStorage.setItem('access_token', 'dashboard-test-token');
      });

      await page.route('**/api/auth/me', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ data: MOCK_USER }),
        });
      });

      await page.route('**/api/bookings', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ data: [] }),
        });
      });

      await page.route('**/api/users/me/budget', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: {
              items: [],
              summary: { totalEstimated: 250000000, totalActual: 80000000, totalPaid: 40000000, itemCount: 0 },
              byCategory: {},
            },
          }),
        });
      });

      await page.route('**/api/users/me', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ data: MOCK_USER }),
        });
      });

      await page.goto('/dashboard');

      await expect(page).toHaveTitle(/Wedding OS/i);
      await expect(page.getByRole('heading', { name: 'Welcome back!' })).toBeVisible();
      await expect(page.getByText('Planning Progress')).toBeVisible();
      await expect(page.getByRole('heading', { name: 'Your Planning Tools' })).toBeVisible();
      await expect(page.getByText('Budget Tracker')).toBeVisible();
    });
  }
});
