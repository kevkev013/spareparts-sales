import { Page } from '@playwright/test'

/**
 * Select an option from a Radix UI Select component.
 * Clicks the trigger to open the dropdown, then clicks the matching option.
 */
export async function selectRadixOption(page: Page, triggerSelector: string, optionText: string) {
  // Click the trigger to open the dropdown
  await page.locator(triggerSelector).click()
  await page.waitForTimeout(300)

  // Click the option matching the text - Radix renders options in a portal
  await page.getByRole('option', { name: optionText }).click()
  await page.waitForTimeout(200)
}

/**
 * Select an option from a Radix Select by index (0-based, skipping placeholder).
 */
export async function selectRadixOptionByIndex(page: Page, triggerSelector: string, index: number = 0) {
  await page.locator(triggerSelector).click()
  await page.waitForTimeout(300)

  const options = page.getByRole('option')
  const count = await options.count()
  if (count > index) {
    await options.nth(index).click()
  }
  await page.waitForTimeout(200)
}
