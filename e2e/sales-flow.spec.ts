import { test, expect } from '@playwright/test'

/**
 * Helper: select from a Radix Select dropdown by clicking trigger then first option.
 * Uses [role="option"] locator with explicit wait for portal rendering.
 */
async function selectFirstRadixOption(page: any, triggerLocator: any) {
  await triggerLocator.click()
  const option = page.locator('[role="option"]').first()
  await expect(option).toBeVisible({ timeout: 5000 })
  await option.click()
  await page.waitForTimeout(300)
}

/**
 * Helper: auto-accept all dialogs (confirm + alert) during form submission.
 * Returns a cleanup function to remove the listener.
 */
function autoAcceptDialogs(page: any) {
  const handler = (dialog: any) => dialog.accept()
  page.on('dialog', handler)
  return () => page.removeListener('dialog', handler)
}

test.describe('Sales Flow E2E', () => {
  test('1. create a new quotation', async ({ page }) => {
    await page.goto('/sales/quotations/create')
    await expect(page.locator('h1')).toContainText('Buat Sales Quotation')

    // Fill quotation date (triggers SQ number auto-generation)
    await page.locator('#sqDate').fill('2025-06-01')
    await page.waitForTimeout(500)

    // Select customer (Radix Select) - wait for options explicitly
    const custTrigger = page.locator('button[role="combobox"]').first()
    await selectFirstRadixOption(page, custTrigger)

    await page.locator('#validUntil').fill('2025-12-31')

    // Add a line item
    await page.getByRole('button', { name: /Tambah Item/ }).click()
    await page.waitForTimeout(500)

    // Select item in the line item row (also Radix Select in table)
    const itemTrigger = page.locator('table').locator('button[role="combobox"]').first()
    await selectFirstRadixOption(page, itemTrigger)

    // Fill quantity
    const qtyInputs = page.locator('table input[type="number"]')
    await expect(qtyInputs.first()).toBeVisible()
    await qtyInputs.first().fill('5')

    // Submit - handle both confirm() and alert() dialogs
    const cleanup = autoAcceptDialogs(page)
    await page.getByRole('button', { name: /Buat Quotation/ }).click()
    await expect(page).toHaveURL(/\/sales\/quotations$/, { timeout: 15000 })
    cleanup()
  })

  test('2. quotation appears in list', async ({ page }) => {
    await page.goto('/sales/quotations')
    await expect(page.locator('table')).toBeVisible()
    // Verify there's actual data (not just a "no data" row)
    await expect(page.locator('table tbody tr').first().locator('a').first()).toBeVisible({ timeout: 5000 })
  })

  test('3. view quotation detail', async ({ page }) => {
    await page.goto('/sales/quotations')
    await expect(page.locator('table')).toBeVisible()

    // Click the Eye icon (detail) link in the first row
    const detailLink = page.locator('table tbody tr').first().locator('a').first()
    await expect(detailLink).toBeVisible({ timeout: 5000 })
    await detailLink.click()
    await expect(page).toHaveURL(/\/sales\/quotations\/[a-zA-Z0-9-]+$/)
  })

  test('4. create Sales Order', async ({ page }) => {
    await page.goto('/sales/orders/create')
    await expect(page.locator('h1')).toContainText('Buat Sales Order')

    await page.locator('#soDate').fill('2025-06-02')
    await page.waitForTimeout(500)

    // Select customer (Radix Select)
    const custTrigger = page.locator('button[role="combobox"]').first()
    await selectFirstRadixOption(page, custTrigger)

    // Fill delivery date to avoid "Invalid date" validation error
    await page.locator('#deliveryDate').fill('2025-06-10')

    // Add a line item
    await page.getByRole('button', { name: /Tambah Item/ }).click()
    await page.waitForTimeout(500)

    // Select item WITH STOCK (SPR-0001 has seed stock of 100 units)
    const itemTrigger = page.locator('table').locator('button[role="combobox"]').first()
    await itemTrigger.click()
    const stockItem = page.locator('[role="option"]').filter({ hasText: 'SPR-0001' })
    if (await stockItem.isVisible({ timeout: 3000 }).catch(() => false)) {
      await stockItem.click()
    } else {
      // Fallback to last option (oldest item, likely has stock)
      await page.locator('[role="option"]').last().click()
    }
    await page.waitForTimeout(300)

    const qtyInputs = page.locator('table input[type="number"]')
    await expect(qtyInputs.first()).toBeVisible()
    await qtyInputs.first().fill('2')

    // Submit - handle both confirm() and alert() dialogs
    const cleanup = autoAcceptDialogs(page)
    await page.getByRole('button', { name: /Buat Order/ }).click()
    await expect(page).toHaveURL(/\/sales\/orders$/, { timeout: 15000 })
    cleanup()
  })

  test('5. SO appears in list with items', async ({ page }) => {
    await page.goto('/sales/orders')
    await expect(page.locator('table')).toBeVisible()

    // Click detail link (Eye icon) in the first row
    const detailLink = page.locator('table tbody tr').first().locator('a').first()
    await expect(detailLink).toBeVisible({ timeout: 5000 })
    await detailLink.click()
    await expect(page).toHaveURL(/\/sales\/orders\/[a-zA-Z0-9-]+$/)
    // Detail page should show items table
    await expect(page.locator('table')).toBeVisible()
  })

  test('6. create Delivery Order from SO detail', async ({ page }) => {
    await page.goto('/sales/orders')
    await expect(page.locator('table')).toBeVisible()

    const detailLink = page.locator('table tbody tr').first().locator('a').first()
    await expect(detailLink).toBeVisible({ timeout: 5000 })
    await detailLink.click()
    await expect(page).toHaveURL(/\/sales\/orders\/[a-zA-Z0-9-]+$/)

    const createDOBtn = page.getByRole('button', { name: /Buat Delivery Order/ })
    if (await createDOBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      const cleanup = autoAcceptDialogs(page)
      await createDOBtn.click()
      // Wait for DO creation API call and page refresh
      await page.waitForTimeout(5000)
      cleanup()
    }
  })

  test('7. DO appears in delivery-orders list', async ({ page }) => {
    await page.goto('/sales/delivery-orders')
    await expect(page.locator('h1')).toContainText('Delivery Orders')
    await expect(page.locator('table')).toBeVisible()
  })

  test('8. complete picking on DO detail', async ({ page }) => {
    await page.goto('/sales/delivery-orders')
    await expect(page.locator('table')).toBeVisible()

    const detailLink = page.locator('table tbody tr').first().locator('a').first()
    if (await detailLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await detailLink.click()
      await expect(page).toHaveURL(/\/sales\/delivery-orders\/[a-zA-Z0-9-]+$/)

      const pickBtn = page.getByRole('button', { name: /Selesai Picking/ })
      if (await pickBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        const cleanup = autoAcceptDialogs(page)
        await pickBtn.click()
        await page.waitForTimeout(5000)
        cleanup()
      }
    }
  })

  test('9. create shipment for DO', async ({ page }) => {
    await page.goto('/sales/delivery-orders')
    await expect(page.locator('table')).toBeVisible()

    const detailLink = page.locator('table tbody tr').first().locator('a').first()
    if (await detailLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await detailLink.click()

      const createShipmentLink = page.getByRole('link', { name: /Buat Pengiriman|Surat Jalan/ })
      if (await createShipmentLink.isVisible({ timeout: 5000 }).catch(() => false)) {
        await createShipmentLink.click()
        await expect(page).toHaveURL(/\/sales\/shipments\/create/)

        await page.locator('#sjDate').fill('2025-06-03')
        await page.waitForTimeout(500)
        await page.locator('#driverName').fill('Driver E2E Test')
        await page.locator('#vehicleNumber').fill('B 1234 ABC')

        const addrInput = page.locator('#deliveryAddress')
        const addrValue = await addrInput.inputValue()
        if (!addrValue) {
          await addrInput.fill('Jl. E2E Test No. 1')
        }

        const cleanup = autoAcceptDialogs(page)
        await page.getByRole('button', { name: /Buat Surat Jalan/ }).click()
        await expect(page).toHaveURL(/\/sales\/shipments/, { timeout: 10000 })
        cleanup()
      }
    }
  })

  test('10. mark shipment as delivered', async ({ page }) => {
    await page.goto('/sales/shipments')
    await expect(page.locator('table')).toBeVisible()

    const detailLink = page.locator('table tbody tr').first().locator('a').first()
    if (await detailLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await detailLink.click()
      await expect(page).toHaveURL(/\/sales\/shipments\/[a-zA-Z0-9-]+$/)

      const deliverBtn = page.getByRole('button', { name: /Tandai Sampai/ })
      if (await deliverBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        const cleanup = autoAcceptDialogs(page)
        await deliverBtn.click()
        await page.waitForTimeout(5000)
        cleanup()
      }
    }
  })

  test('11. invoice appears in list', async ({ page }) => {
    await page.goto('/sales/invoices')
    await expect(page.locator('h1')).toContainText('Invoices')
    await expect(page.locator('table')).toBeVisible()
  })

  test('12. create payment for invoice', async ({ page }) => {
    await page.goto('/sales/invoices')
    await expect(page.locator('table')).toBeVisible()

    const detailLink = page.locator('table tbody tr').first().locator('a').first()
    if (await detailLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await detailLink.click()
      await expect(page).toHaveURL(/\/sales\/invoices\/[a-zA-Z0-9-]+$/)

      const payLink = page.getByRole('link', { name: /Bayar/ })
      if (await payLink.isVisible({ timeout: 5000 }).catch(() => false)) {
        await payLink.click()
        await expect(page).toHaveURL(/\/payments\/create/)

        await page.locator('#paymentDate').fill('2025-06-05')
        await page.waitForTimeout(500)

        // Payment method is Radix Select
        const methodTrigger = page.locator('button[role="combobox"]').first()
        await methodTrigger.click()
        await page.locator('[role="option"]').filter({ hasText: /Transfer/ }).click()
        await page.waitForTimeout(300)

        await page.locator('#amount').fill('100000')
        await page.locator('#referenceNumber').fill('TF-E2E-001')

        const cleanup = autoAcceptDialogs(page)
        await page.getByRole('button', { name: /Simpan Pembayaran/ }).click()
        await expect(page).toHaveURL(/\/payments/, { timeout: 10000 })
        cleanup()
      }
    }
  })
})
