import { expect, test } from '@playwright/test';

const CONSENT_KEY = 'weddingos_cookie_consent';
const VIEWPORTS = [
  { name: 'desktop', width: 1280, height: 900 },
  { name: 'mobile', width: 375, height: 812 },
] as const;

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
  {
    id: 'vendor-2',
    businessName: 'Srikanth Photography',
    category: 'photography',
    city: 'Hyderabad',
    citiesServed: ['Hyderabad'],
    rating: 4.8,
    totalReviews: 189,
    totalBookings: 156,
    basePrice: 80000,
    coverImage: 'https://images.unsplash.com/photo-1537907690979-13c0f6a4c7f4?w=400&q=80',
    verificationStatus: 'verified',
    featured: true,
    responseTimeHours: 3,
    yearsExperience: 8,
    teamSize: 8,
    cancellationRate: 1.8,
    eventTypes: ['Wedding', 'Engagement'],
    latitude: 17.4121,
    longitude: 78.4482,
  },
  {
    id: 'vendor-3',
    businessName: 'Flavours Catering Co.',
    category: 'catering',
    city: 'Hyderabad',
    citiesServed: ['Hyderabad'],
    rating: 4.7,
    totalReviews: 312,
    totalBookings: 420,
    basePrice: 800,
    coverImage: 'https://images.unsplash.com/photo-1555244162-803834f70033?w=400&q=80',
    verificationStatus: 'verified',
    featured: false,
    responseTimeHours: 1,
    yearsExperience: 15,
    teamSize: 120,
    cancellationRate: 1.1,
    eventTypes: ['Wedding', 'Reception'],
    latitude: 17.3616,
    longitude: 78.4747,
  },
];

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

  await page.route('**/api/search/vendors**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ data: { vendors: MOCK_VENDORS } }),
    });
  });
}

test.describe('Vendor discovery', () => {
  for (const viewport of VIEWPORTS) {
    test(`search and filters work on ${viewport.name}`, async ({ page }) => {
      await preparePage(page);
      await page.setViewportSize({ width: viewport.width, height: viewport.height });

      await page.goto('/vendors');

      await expect(page).toHaveTitle(/Wedding OS/i);
      await expect(page.getByLabel('Search vendors')).toBeVisible();
      await expect(page.getByText('Royal Grand Palace')).toBeVisible();
      await expect(page.getByText('Srikanth Photography')).toBeVisible();

      await page.getByLabel('Search vendors').fill('photo');
      await expect(page.getByText('Srikanth Photography')).toBeVisible();
      await expect(page.getByText('Royal Grand Palace')).toBeHidden();

      await page.getByRole('button', { name: 'Filter by Photography' }).click();
      await expect(page.getByText(/Photography/i).first()).toBeVisible();
      await expect(page.getByText('Flavours Catering Co.')).toBeHidden();
    });
  }

  test('vendor detail page loads with rating and reviews', async ({ page }) => {
    await preparePage(page);

    await page.goto('/vendors/vendor-2');

    await expect(page).toHaveTitle(/Wedding OS/i);
    await expect(page.getByRole('heading', { name: 'Srikanth Photography' })).toBeVisible();
    await expect(page.getByText('(189 reviews)')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Reviews' })).toBeVisible();
    await expect(page.getByRole('link', { name: /Send Enquiry/i }).first()).toBeVisible();
  });
});
