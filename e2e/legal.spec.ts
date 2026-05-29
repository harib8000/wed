import { expect, test } from '@playwright/test';

const CONSENT_KEY = 'weddingos_cookie_consent';

const LEGAL_PAGES = [
  {
    path: '/privacy',
    heading: 'Privacy Policy',
    content: 'Information We Collect',
  },
  {
    path: '/terms',
    heading: 'Terms of Service',
    content: 'Booking & Payments',
  },
  {
    path: '/refund',
    heading: 'Refund Policy',
    content: 'Escrow Protection',
  },
] as const;

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

test.describe('Legal pages', () => {
  for (const legalPage of LEGAL_PAGES) {
    test(`${legalPage.path} loads expected content`, async ({ page }) => {
      await preparePage(page);

      await page.goto(legalPage.path);

      await expect(page).toHaveTitle(/Wedding OS/i);
      await expect(page.getByRole('heading', { name: legalPage.heading })).toBeVisible();
      await expect(page.locator('summary').filter({ hasText: legalPage.content }).first()).toBeVisible();
      await expect(page.getByText(/Last Updated: May 2026/i)).toBeVisible();
    });
  }
});
