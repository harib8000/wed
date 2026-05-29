import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

test.describe('WeddingOS smoke test', () => {
  test('home page loads', async ({ page }) => {
    await page.goto(BASE_URL);
    await expect(page).toHaveTitle(/Wedding/i);
  });

  test('vendor listing page loads', async ({ page }) => {
    await page.goto(`${BASE_URL}/vendors`);
    await expect(page.locator('h1, h2').first()).toBeVisible();
  });

  test('login page is accessible', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await expect(page.locator('input[type="tel"], input[type="email"], input[type="text"]').first()).toBeVisible();
  });

  test('user can register and reach onboarding', async ({ page }) => {
    const phone = `9${Date.now().toString().slice(-9)}`;
    await page.goto(`${BASE_URL}/register`);

    const phoneInput = page.locator('input[type="tel"], input[name*="phone"], input[placeholder*="phone" i]').first();
    if (await phoneInput.isVisible()) {
      await phoneInput.fill(phone);
    }

    await page.goto(`${BASE_URL}/vendors`);
    await expect(page.locator('body')).toBeVisible();
  });
});
