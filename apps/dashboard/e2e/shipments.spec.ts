import { expect, test } from '@playwright/test';

test.describe('shipments', () => {
  test('costs are shown in euros', async ({ page }) => {
    await page.goto('/shipments?chaos=off');
    await expect(page.getByTestId('shipment-row')).toHaveCount(20);
    const costs = await page.getByTestId('shipment-cost').allTextContents();
    expect(costs).toHaveLength(20);
    for (const cost of costs) {
      expect(cost).toMatch(/^\d{1,2},\d{2}\s€$/);
    }
  });

  test('loads older shipments on demand', async ({ page }) => {
    await page.goto('/shipments?chaos=off');
    await expect(page.getByTestId('shipment-row')).toHaveCount(20);
    await page.getByRole('button', { name: 'Load more' }).click();
    await expect(page.getByTestId('shipment-row')).toHaveCount(40);
  });

  test('shows only the parcels with a problem', async ({ page }) => {
    await page.goto('/shipments?chaos=off');
    await page.getByRole('button', { name: 'Show problems only' }).click();

    await expect(page).toHaveURL(/status=exception/);
    const rows = page.getByTestId('shipment-row');
    await expect(rows.first()).toBeVisible();
    await expect(page.getByText('Showing 11 shipments')).toBeVisible();
    for (const row of await rows.all()) {
      await expect(row).toContainText('Problem');
    }
  });

  test('finds a shipment by order number and keeps the search when opening it', async ({ page }) => {
    await page.goto('/shipments?chaos=off');
    await page.getByPlaceholder(/Order number/).fill('10042');

    await expect(page.getByTestId('shipment-row')).toHaveCount(1);
    await page.getByTestId('shipment-row').click();

    await expect(page.getByRole('complementary', { name: 'Shipment details' })).toContainText('AL-10042');
    await expect(page).toHaveURL(/q=10042/);
  });
});
