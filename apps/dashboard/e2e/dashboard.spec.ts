import { expect, test } from '@playwright/test';

test('shows the orders waiting for a label', async ({ page }) => {
  await page.goto('/orders');
  await expect(page.getByRole('heading', { name: 'Orders to ship' })).toBeVisible();
});

test.fixme('Inès can create a label for an order', async () => {
  // TODO
});
