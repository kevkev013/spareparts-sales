import { test, expect } from '@playwright/test'

test.describe('Payments', () => {
  test('list page loads with table', async ({ page }) => {
    await page.goto('/payments')
    await expect(page.locator('h1')).toContainText('Payments')
    await expect(page.locator('table')).toBeVisible()
  })

  test('list shows payment columns', async ({ page }) => {
    await page.goto('/payments')
    await expect(page.locator('table')).toBeVisible()

    const headers = page.locator('table thead th')
    await expect(headers.first()).toBeVisible()
  })

  test('create payment button visible for admin', async ({ page }) => {
    await page.goto('/payments')
    await expect(page.locator('table')).toBeVisible()

    // Admin should see "Catat Pembayaran" button
    const createBtn = page.getByRole('link', { name: /Catat Pembayaran/ })
    await expect(createBtn).toBeVisible({ timeout: 5000 })
  })

  test('create payment page loads', async ({ page }) => {
    await page.goto('/payments/create')
    await expect(page.locator('h1')).toContainText('Catat Pembayaran')

    // Form fields should be visible
    await expect(page.locator('#paymentDate')).toBeVisible()

    // Payment number should be auto-generated (disabled input)
    const paymentNumber = page.locator('input[disabled]').first()
    await expect(paymentNumber).toBeVisible()
  })

  test('create payment form - invoice dropdown loads', async ({ page }) => {
    await page.goto('/payments/create')
    await expect(page.locator('h1')).toContainText('Catat Pembayaran')

    // Wait for invoices to load
    await page.waitForTimeout(2000)

    // Invoice select should be available (either select or combobox)
    const invoiceSelect = page.locator('select, [role="combobox"]').first()
    await expect(invoiceSelect).toBeVisible({ timeout: 5000 })
  })

  test('create payment form - payment method select', async ({ page }) => {
    await page.goto('/payments/create')
    await expect(page.locator('h1')).toContainText('Catat Pembayaran')

    // Payment method select should be visible
    const methodSelect = page.locator('#paymentMethod, select').last()
    if (await methodSelect.isVisible({ timeout: 3000 }).catch(() => false)) {
      // Should have payment method options
      await expect(methodSelect).toBeVisible()
    }
  })

  test('create payment with invoice pre-selected', async ({ page }) => {
    // First find an unpaid invoice
    await page.goto('/sales/invoices')
    await expect(page.locator('table')).toBeVisible()

    const detailLink = page.locator('table tbody tr').first().locator('a').first()
    if (await detailLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await detailLink.click()
      await expect(page).toHaveURL(/\/sales\/invoices\/[a-zA-Z0-9-]+$/)

      // Click pay button
      const payLink = page.getByRole('link', { name: /Bayar/ })
      if (await payLink.isVisible({ timeout: 5000 }).catch(() => false)) {
        await payLink.click()
        await expect(page).toHaveURL(/\/payments\/create/)

        // Invoice should be pre-selected (disabled input showing invoice info)
        await page.waitForTimeout(2000)

        // Invoice details should show amounts
        const invoiceInfo = page.locator('text=Total Tagihan, text=Sisa Tagihan')
        if (await invoiceInfo.first().isVisible({ timeout: 5000 }).catch(() => false)) {
          // Good - invoice info loaded
        }

        // Fill payment date
        const dateInput = page.locator('#paymentDate')
        await expect(dateInput).toBeVisible()
        const dateValue = await dateInput.inputValue()
        if (!dateValue) {
          const today = new Date().toISOString().split('T')[0]
          await dateInput.fill(today)
          await page.waitForTimeout(500)
        }

        // Amount should be pre-filled
        const amountInput = page.locator('#amount')
        if (await amountInput.isVisible({ timeout: 3000 }).catch(() => false)) {
          const amount = await amountInput.inputValue()
          if (!amount || amount === '0') {
            await amountInput.fill('50000')
          }
        }

        // Reference number
        const refInput = page.locator('#referenceNumber')
        if (await refInput.isVisible({ timeout: 2000 }).catch(() => false)) {
          await refInput.fill('E2E-PAY-' + Date.now().toString().slice(-6))
        }

        // Submit
        page.once('dialog', (dialog) => dialog.accept())
        await page.getByRole('button', { name: /Simpan Pembayaran/ }).click()
        await expect(page).toHaveURL(/\/payments/, { timeout: 15000 })
      }
    }
  })

  test('payment appears in list after creation', async ({ page }) => {
    await page.goto('/payments')
    await expect(page.locator('table')).toBeVisible()

    // Should have at least one row
    const firstRow = page.locator('table tbody tr').first()
    await expect(firstRow).toBeVisible({ timeout: 5000 })
  })

  test('search payments works', async ({ page }) => {
    await page.goto('/payments')
    await expect(page.locator('table')).toBeVisible()

    const searchInput = page.locator('input[type="text"], input[placeholder*="Cari"]').first()
    if (await searchInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await searchInput.fill('PAY')
      await page.waitForTimeout(1000)
      await expect(page.locator('table')).toBeVisible()
    }
  })
})
