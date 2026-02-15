import { test, expect } from '@playwright/test'

function autoAcceptDialogs(page: any) {
  const handler = (dialog: any) => dialog.accept()
  page.on('dialog', handler)
  return () => page.removeListener('dialog', handler)
}

test.describe('Master Batches', () => {
  test('list page loads with table', async ({ page }) => {
    await page.goto('/master/batches')
    await expect(page.locator('h1')).toContainText('Master Batch')
    await expect(page.locator('table')).toBeVisible()
  })

  test('create batch with item select and fields', async ({ page }) => {
    await page.goto('/master/batches/create')
    await expect(page.locator('h1')).toContainText('Tambah Batch Baru')

    // Fill purchase date first (triggers batch number auto-generation)
    await page.locator('#purchaseDate').fill('2025-01-15')
    await page.waitForTimeout(1000)

    // Item is a Radix Select - click trigger and wait for options
    const itemTrigger = page.locator('button[role="combobox"]').filter({ hasText: /Pilih item/ })
    await itemTrigger.click()
    // Wait for dropdown options to render in portal
    const firstOption = page.locator('[role="option"]').first()
    await expect(firstOption).toBeVisible({ timeout: 5000 })
    await firstOption.click()
    await page.waitForTimeout(300)

    await page.locator('#purchasePrice').fill('25000')
    await page.locator('#supplier').fill('E2E Test Supplier')
    // Fill optional expiry date to avoid "Invalid date" validation error
    await page.locator('#expiryDate').fill('2026-12-31')

    const cleanup = autoAcceptDialogs(page)
    await page.getByRole('button', { name: /Tambah Batch/ }).click()
    await expect(page).toHaveURL(/\/master\/batches$/, { timeout: 10000 })
    cleanup()
  })

  test('edit batch', async ({ page }) => {
    await page.goto('/master/batches')
    await expect(page.locator('table')).toBeVisible()

    const firstRow = page.locator('table tbody tr').first()
    const editLink = firstRow.locator('a[href*="/edit"]')

    if (await editLink.isVisible({ timeout: 3000 }).catch(() => false)) {
      await editLink.click()
      await expect(page).toHaveURL(/\/master\/batches\/[a-zA-Z0-9-]+\/edit/)

      const supplierInput = page.locator('#supplier')
      await expect(supplierInput).toBeVisible()

      // Fill expiry date if empty to avoid "Invalid date" validation
      const expiryDate = page.locator('#expiryDate')
      if (await expiryDate.isVisible().catch(() => false)) {
        const val = await expiryDate.inputValue()
        if (!val) {
          await expiryDate.fill('2026-12-31')
        }
      }

      const cleanup = autoAcceptDialogs(page)
      await page.getByRole('button', { name: /Update Batch/ }).click()
      await expect(page).toHaveURL(/\/master\/batches$/, { timeout: 10000 })
      cleanup()
    }
  })

  test('delete batch', async ({ page }) => {
    await page.goto('/master/batches')
    await expect(page.locator('table')).toBeVisible()

    page.once('dialog', (dialog) => dialog.accept())
    const deleteBtn = page.locator('button').filter({ has: page.locator('svg.lucide-trash-2') }).last()
    if (await deleteBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await deleteBtn.click()
      await page.waitForTimeout(1000)
    }
  })

  test('batch number auto-generates from date', async ({ page }) => {
    await page.goto('/master/batches/create')

    const batchNumberInput = page.locator('#batchNumber')
    await page.locator('#purchaseDate').fill('2025-06-01')
    await page.waitForTimeout(1500)

    const value = await batchNumberInput.inputValue()
    expect(value.length).toBeGreaterThan(0)
  })

  test('detail page shows batch info', async ({ page }) => {
    await page.goto('/master/batches')
    await expect(page.locator('table')).toBeVisible()

    const firstRow = page.locator('table tbody tr').first()
    await firstRow.locator('a').first().click()
    await expect(page).toHaveURL(/\/master\/batches\/[a-zA-Z0-9-]+$/)
  })
})
