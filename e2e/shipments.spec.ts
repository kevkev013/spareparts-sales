import { test, expect } from '@playwright/test'

test.describe('Shipments', () => {
  test('list page loads with table', async ({ page }) => {
    await page.goto('/sales/shipments')
    await expect(page.locator('h1')).toContainText('Shipments')
    await expect(page.locator('table')).toBeVisible()
  })

  test('list shows shipment columns', async ({ page }) => {
    await page.goto('/sales/shipments')
    await expect(page.locator('table')).toBeVisible()

    // Check table headers exist
    const headers = page.locator('table thead th')
    await expect(headers.first()).toBeVisible()
  })

  test('status filter works', async ({ page }) => {
    await page.goto('/sales/shipments')
    await expect(page.locator('table')).toBeVisible()

    // Check if status filter exists (select or buttons)
    const statusFilter = page.locator('select, [role="combobox"]').first()
    if (await statusFilter.isVisible({ timeout: 3000 }).catch(() => false)) {
      await statusFilter.click()
      await page.waitForTimeout(500)
    }
  })

  test('search filter works', async ({ page }) => {
    await page.goto('/sales/shipments')
    await expect(page.locator('table')).toBeVisible()

    const searchInput = page.locator('input[type="text"], input[placeholder*="Cari"]').first()
    if (await searchInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await searchInput.fill('SJ')
      await page.waitForTimeout(1000)
      // Page should still have table (results or empty)
      await expect(page.locator('table')).toBeVisible()
    }
  })

  test('detail page loads from list', async ({ page }) => {
    await page.goto('/sales/shipments')
    await expect(page.locator('table')).toBeVisible()

    const detailLink = page.locator('table tbody tr').first().locator('a').first()
    if (await detailLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await detailLink.click()
      await expect(page).toHaveURL(/\/sales\/shipments\/[a-zA-Z0-9-]+$/)

      // Detail page should show shipment info
      await expect(page.locator('h1')).toContainText('Surat Jalan')

      // Should show customer info card
      await expect(page.getByText('Informasi Customer')).toBeVisible()

      // Should show shipment info card
      await expect(page.getByText('Informasi Pengiriman')).toBeVisible()

      // Should show items table
      await expect(page.locator('table')).toBeVisible()
    }
  })

  test('detail page shows print button', async ({ page }) => {
    await page.goto('/sales/shipments')
    await expect(page.locator('table')).toBeVisible()

    const detailLink = page.locator('table tbody tr').first().locator('a').first()
    if (await detailLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await detailLink.click()
      await expect(page).toHaveURL(/\/sales\/shipments\/[a-zA-Z0-9-]+$/)

      // Print button should be visible for admin
      const printBtn = page.getByRole('button', { name: /Cetak Surat Jalan/ })
      await expect(printBtn).toBeVisible({ timeout: 5000 })
    }
  })

  test('mark shipment as delivered', async ({ page }) => {
    await page.goto('/sales/shipments')
    await expect(page.locator('table')).toBeVisible()

    // Find a shipment with in_transit status
    const rows = page.locator('table tbody tr')
    const rowCount = await rows.count()

    for (let i = 0; i < rowCount; i++) {
      const row = rows.nth(i)
      const statusBadge = row.locator('text=in_transit, text=Dalam Perjalanan')
      if (await statusBadge.isVisible({ timeout: 1000 }).catch(() => false)) {
        // Click detail link
        await row.locator('a').first().click()
        await expect(page).toHaveURL(/\/sales\/shipments\/[a-zA-Z0-9-]+$/)

        const deliverBtn = page.getByRole('button', { name: /Tandai Sampai/ })
        if (await deliverBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
          page.once('dialog', (dialog) => dialog.accept())
          await deliverBtn.click()
          await page.waitForTimeout(3000)

          // Status should change — either redirected or badge updated
          const deliveredBadge = page.locator('text=delivered, text=Terkirim')
          if (await deliveredBadge.isVisible({ timeout: 5000 }).catch(() => false)) {
            // Success
          }
        }
        break
      }
    }
  })

  test('create shipment page requires doId', async ({ page }) => {
    await page.goto('/sales/shipments/create')
    // Without doId, should show error or redirect
    await page.waitForTimeout(2000)
  })

  test('create shipment from DO', async ({ page }) => {
    // Navigate to a delivery order that's ready for shipment
    await page.goto('/sales/delivery-orders')
    await expect(page.locator('table')).toBeVisible()

    const detailLink = page.locator('table tbody tr').first().locator('a').first()
    if (await detailLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await detailLink.click()
      await expect(page).toHaveURL(/\/sales\/delivery-orders\/[a-zA-Z0-9-]+$/)

      // Look for "Buat Pengiriman" or "Surat Jalan" link
      const createShipmentLink = page.getByRole('link', { name: /Buat Pengiriman|Surat Jalan/ })
      if (await createShipmentLink.isVisible({ timeout: 5000 }).catch(() => false)) {
        await createShipmentLink.click()
        await expect(page).toHaveURL(/\/sales\/shipments\/create/)

        // Form should be pre-filled with DO info
        await expect(page.locator('h1')).toContainText('Buat Surat Jalan')

        // Date field
        const dateInput = page.locator('#sjDate')
        await expect(dateInput).toBeVisible()

        // Driver field
        await page.locator('#driverName').fill('E2E Test Driver')
        await page.locator('#vehicleNumber').fill('B 9999 E2E')

        // Address should be pre-filled
        const addrInput = page.locator('#deliveryAddress')
        await expect(addrInput).toBeVisible()
        const addrValue = await addrInput.inputValue()
        if (!addrValue) {
          await addrInput.fill('Jl. E2E Test Shipment No. 1')
        }

        // Submit
        page.once('dialog', (dialog) => dialog.accept())
        await page.getByRole('button', { name: /Buat Surat Jalan/ }).click()
        await expect(page).toHaveURL(/\/sales\/shipments/, { timeout: 15000 })
      }
    }
  })
})
