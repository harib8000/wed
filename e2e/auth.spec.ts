import { expect, test } from '@playwright/test';

const CONSENT_KEY = 'weddingos_cookie_consent';
const VIEWPORTS = [
  { name: 'desktop', width: 1280, height: 900 },
  { name: 'mobile', width: 375, height: 812 },
] as const;

async function dismissCookieBanner(page: import('@playwright/test').Page) {
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

test.describe('Authentication flows', () => {
  for (const viewport of VIEWPORTS) {
    test(`login page loads on ${viewport.name}`, async ({ page }) => {
      await dismissCookieBanner(page);
      await page.setViewportSize({ width: viewport.width, height: viewport.height });

      await page.goto('/login');

      await expect(page).toHaveTitle(/Wedding OS/i);
      await expect(page.getByRole('heading', { name: 'Welcome!' })).toBeVisible();
      await expect(page.getByRole('link', { name: /Couple \/ Customer/i })).toBeVisible();
      await expect(page.getByRole('link', { name: /Vendor \/ Service Provider/i })).toBeVisible();
      await expect(page.getByText('Quick Demo Access')).toBeVisible();
    });
  }

  test('couple sign-in validates and shows OTP step', async ({ page }) => {
    await dismissCookieBanner(page);
    await page.route('**/api/auth/send-otp', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: { success: true } }),
      });
    });

    await page.goto('/login/couple');

    await expect(page).toHaveTitle(/Wedding OS/i);
    await expect(page.getByRole('heading', { name: 'Couple Sign In' })).toBeVisible();

    const phoneInput = page.getByPlaceholder('9876543210');
    const submitButton = page.getByRole('button', { name: /Get OTP/i });

    await expect(phoneInput).toBeVisible();
    await expect(submitButton).toBeDisabled();

    await phoneInput.fill('9876543210');
    await expect(submitButton).toBeEnabled();

    await submitButton.click();

    await expect(page.getByRole('heading', { name: 'Verify OTP' })).toBeVisible();
    await expect(page.getByPlaceholder('• • • • • •')).toBeVisible();
    await expect(page.getByText('Sent to +91 9876543210')).toBeVisible();
  });

  test('phone entry enforces a 10-digit Indian mobile number', async ({ page }) => {
    await dismissCookieBanner(page);

    await page.goto('/login/couple');

    const phoneInput = page.getByPlaceholder('9876543210');
    await phoneInput.fill('9876543210123');

    await expect(phoneInput).toHaveValue('9876543210');
    await expect(page.locator('text=+91').first()).toBeVisible();
  });
});
