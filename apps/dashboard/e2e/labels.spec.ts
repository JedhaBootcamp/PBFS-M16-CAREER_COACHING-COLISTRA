import { expect, test, type Page } from '@playwright/test';

async function labelsThisMonth(page: Page): Promise<number> {
  const usage = page.getByTestId('labels-this-month');
  await expect(usage).not.toHaveText('—');
  return Number(await usage.textContent());
}

test.describe('buying labels', () => {
  test('a double click buys only one label', async ({ page }) => {
    await page.goto('/orders?chaos=off');
    const before = await labelsThisMonth(page);
    const firstOrder = page.getByTestId('order-row').first();
    const orderNumber = (await firstOrder.locator('p').first().textContent())!;

    await firstOrder.getByRole('button', { name: /Create label/ }).dblclick();

    await expect(page.getByRole('status').filter({ hasText: `Label created for ${orderNumber}` })).toBeVisible();
    await expect(page.getByTestId('labels-this-month')).toHaveText(String(before + 1));
    // Give a second purchase every chance to land, then look for the order's shipments.
    // Navigate inside the app: a full page load would reset the mock API's data.
    await page.waitForTimeout(1500);
    await page.getByRole('link', { name: 'Shipments' }).click();
    await page.getByPlaceholder(/Order number/).fill(orderNumber);
    await expect(page.getByText('Showing 1 shipments')).toBeVisible();
    await expect(page.getByTestId('shipment-row')).toHaveCount(1);
  });

  test('a label whose response was lost is not bought twice when retried', async ({ page }) => {
    // In flaky mode every other request fails, and failed label purchases are still charged.
    await page.goto('/orders?chaos=flaky');
    const before = await labelsThisMonth(page);

    await page.getByTestId('order-row').first().getByRole('button', { name: /Create label/ }).click();

    await expect(page.getByText(/Label created for/)).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId('labels-this-month')).toHaveText(String(before + 1));
  });

  test('Inès compares carriers and buys the cheapest', async ({ page }) => {
    await page.goto('/orders?chaos=off');
    await page.getByTestId('order-row').first().getByRole('button', { name: 'Compare rates' }).click();

    const panel = page.getByRole('complementary', { name: /Compare rates/ });
    const options = panel.getByTestId('rate-option');
    await expect(options).toHaveCount(5);
    await expect(options.first()).toContainText('Cheapest');
    await expect(panel.getByText('Fastest')).toBeVisible();
    await expect(options.first().getByRole('radio')).toBeChecked();

    await panel.getByRole('button', { name: /Buy label · Mondial Relay/ }).click();

    await expect(page.getByText(/Label created for .* Mondial Relay/)).toBeVisible();
    await expect(panel).toBeHidden();
  });
});
