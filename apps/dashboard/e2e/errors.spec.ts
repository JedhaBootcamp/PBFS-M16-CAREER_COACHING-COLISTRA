import { expect, test } from '@playwright/test';

test.describe('when Colistra fails', () => {
  test('the orders page explains the problem instead of going blank', async ({ page }) => {
    await page.goto('/orders?chaos=down');
    await expect(page.getByRole('alert')).toContainText('Colistra is having trouble', { timeout: 15_000 });
    await expect(page.getByRole('heading', { name: 'Orders to ship' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Try again' })).toBeVisible();
  });

  test('the shipments page explains the problem instead of going blank', async ({ page }) => {
    await page.goto('/shipments?chaos=down');
    await expect(page.getByRole('alert')).toContainText('Colistra is having trouble', { timeout: 15_000 });
    await expect(page.getByRole('link', { name: 'Orders to ship' })).toBeVisible();
  });

  test('rate limits are retried automatically', async ({ page }) => {
    // The limit drops to 3 requests per 5 seconds: clicking through shipments hits it.
    await page.goto('/shipments?chaos=ratelimit');
    const rows = page.getByTestId('shipment-row');
    for (let i = 0; i < 4; i++) {
      await rows.nth(i).click();
    }
    const panel = page.getByRole('complementary', { name: 'Shipment details' });
    await expect(panel.getByText('Tracking history')).toBeVisible({ timeout: 20_000 });
    await expect(page.getByTestId('shipment-row')).toHaveCount(20);
  });
});
