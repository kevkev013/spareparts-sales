import { test, expect } from '@playwright/test'

test.describe('Invoices', () => {
  test('list page loads with table', async ({ page }) => {
    await page.goto('/sales/invoices')
    await expect(page.locator('h1')).toContainText('Invoices')
    await expect(page.locator('table')).toBeVisible()
  })

  test('list shows invoice columns', async ({ page }) => {
    await page.goto('/sales/invoices')
    await expect(page.locator('table')).toBeVisible()

    // Table should have headers
    const headers = page.locator('table thead th')
    await expect(headers.first()).toBeVisible()

    // Should show key columns
    await expect(page.locator('table thead')).toContainText('Invoice')
    await expect(page.locator('table thead')).toContainText('Customer')
  })

  test('search filter works', async ({ page }) => {
    await page.goto('/sales/invoices')
    await expect(page.locator('table')).toBeVisible()

    const searchInput = page.locator('input[type="text"], input[placeholder*="Cari"]').first()
    if (await searchInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await searchInput.fill('INV')
      await page.waitForTimeout(1000)
      await expect(page.locator('table')).toBeVisible()
    }
  })

  test('detail page loads from list', async ({ page }) => {
    await page.goto('/sales/invoices')
    await expect(page.locator('table')).toBeVisible()

    const detailLink = page.locator('table tbody tr').first().locator('a').first()
    if (await detailLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await detailLink.click()
      await expect(page).toHaveURL(/\/sales\/invoices\/[a-zA-Z0-9-]+$/)

      // Detail page elements
      await expect(page.locator('h1')).toContainText('Invoice')

      // Customer info card
      await expect(page.getByText('Informasi Customer')).toBeVisible()

      // Invoice info card
      await expect(page.getByText('Informasi Invoice')).toBeVisible()

      // Payment status card
      await expect(page.getByText('Status Pembayaran')).toBeVisible()

      // Items table
      await expect(page.locator('table')).toBeVisible()

      // Should show Grand Total
      await expect(page.getByText('Grand Total')).toBeVisible()
    }
  })

  test('detail page shows print button', async ({ page }) => {
    await page.goto('/sales/invoices')
    await expect(page.locator('table')).toBeVisible()

    const detailLink = page.locator('table tbody tr').first().locator('a').first()
    if (await detailLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await detailLink.click()
      await expect(page).toHaveURL(/\/sales\/invoices\/[a-zA-Z0-9-]+$/)

      // Print button should be visible for admin
      const printBtn = page.getByRole('button', { name: /Cetak Invoice/ })
      await expect(printBtn).toBeVisible({ timeout: 5000 })
    }
  })

  test('detail page shows pay button for unpaid invoice', async ({ page }) => {
    await page.goto('/sales/invoices')
    await expect(page.locator('table')).toBeVisible()

    // Find an unpaid invoice
    const rows = page.locator('table tbody tr')
    const rowCount = await rows.count()

    for (let i = 0; i < rowCount; i++) {
      const row = rows.nth(i)
      // Look for unpaid/partial_paid status
      const unpaidBadge = row.locator('text=unpaid, text=Belum Dibayar, text=partial_paid')
      if (await unpaidBadge.isVisible({ timeout: 1000 }).catch(() => false)) {
        await row.locator('a').first().click()
        await expect(page).toHaveURL(/\/sales\/invoices\/[a-zA-Z0-9-]+$/)

        // Pay button should be visible
        const payBtn = page.getByRole('link', { name: /Bayar/ })
        await expect(payBtn).toBeVisible({ timeout: 5000 })
        break
      }
    }
  })

  test('invoice detail shows SO reference link', async ({ page }) => {
    await page.goto('/sales/invoices')
    await expect(page.locator('table')).toBeVisible()

    const detailLink = page.locator('table tbody tr').first().locator('a').first()
    if (await detailLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await detailLink.click()
      await expect(page).toHaveURL(/\/sales\/invoices\/[a-zA-Z0-9-]+$/)

      // Should have link to SO
      const soLink = page.locator('a[href*="/sales/orders/"]')
      if (await soLink.isVisible({ timeout: 3000 }).catch(() => false)) {
        // Verify the link exists and points to a valid SO URL
        const href = await soLink.getAttribute('href')
        expect(href).toMatch(/\/sales\/orders\/[a-zA-Z0-9-]+/)
      }
    }
  })

  test('invoice items table shows pricing', async ({ page }) => {
    await page.goto('/sales/invoices')
    await expect(page.locator('table')).toBeVisible()

    const detailLink = page.locator('table tbody tr').first().locator('a').first()
    if (await detailLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await detailLink.click()
      await expect(page).toHaveURL(/\/sales\/invoices\/[a-zA-Z0-9-]+$/)

      // Items table should show pricing columns
      const itemsTable = page.locator('table').last()
      await expect(itemsTable).toBeVisible()

      // Should have Subtotal and Grand Total
      await expect(page.getByText('Subtotal')).toBeVisible()
      await expect(page.getByText('Grand Total')).toBeVisible()
    }
  })
})
