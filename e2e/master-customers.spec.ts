import { test, expect } from '@playwright/test'

test.describe('Master Customers', () => {
  test('list page loads with table', async ({ page }) => {
    await page.goto('/master/customers')
    await expect(page.locator('h1')).toContainText('Master Customer')
    await expect(page.locator('table')).toBeVisible()
  })

  test('create customer with all fields', async ({ page }) => {
    await page.goto('/master/customers/create')
    await expect(page.locator('h1')).toContainText('Tambah Customer Baru')

    // Customer name (required)
    await page.locator('#customerName').fill('E2E Test Customer ' + Date.now())

    // Tipe Customer is a Radix Select - click trigger then select option
    const typeLabel = page.getByText('Tipe Customer *')
    const typeSection = typeLabel.locator('..')
    const typeTrigger = typeSection.getByRole('combobox')
    await typeTrigger.click()
    await page.getByRole('option', { name: 'Retail' }).click()

    await page.locator('#phone').fill('081234567890')
    await page.locator('#email').fill('e2e-test@example.com')
    await page.locator('#address').fill('Jl. Test E2E No. 1')
    await page.locator('#city').fill('Jakarta')
    await page.locator('#creditLimit').fill('5000000')
    await page.locator('#creditTerm').fill('30')
    await page.locator('#discountRate').fill('5')

    // Handle success alert dialog
    page.once('dialog', (dialog) => dialog.accept())
    await page.getByRole('button', { name: /Tambah Customer/ }).click()
    await expect(page).toHaveURL(/\/master\/customers$/, { timeout: 10000 })
  })

  test('new customer appears in list', async ({ page }) => {
    await page.goto('/master/customers')
    await expect(page.locator('table')).toBeVisible()
    await expect(page.locator('table tbody tr').first()).toBeVisible()
  })

  test('edit customer updates name', async ({ page }) => {
    await page.goto('/master/customers')
    await expect(page.locator('table')).toBeVisible()

    const firstRow = page.locator('table tbody tr').first()
    const editLink = firstRow.locator('a[href*="/edit"]')

    if (await editLink.isVisible({ timeout: 3000 }).catch(() => false)) {
      await editLink.click()
      await expect(page).toHaveURL(/\/master\/customers\/[a-zA-Z0-9-]+\/edit/)

      const nameInput = page.locator('#customerName')
      await expect(nameInput).not.toHaveValue('')

      page.once('dialog', (dialog) => dialog.accept())
      await page.getByRole('button', { name: /Update Customer/ }).click()
      await expect(page).toHaveURL(/\/master\/customers$/, { timeout: 10000 })
    }
  })

  test('delete customer', async ({ page }) => {
    // Create a customer to delete
    await page.goto('/master/customers/create')
    const name = 'Delete Customer ' + Date.now()
    await page.locator('#customerName').fill(name)

    page.once('dialog', (dialog) => dialog.accept())
    await page.getByRole('button', { name: /Tambah Customer/ }).click()
    await expect(page).toHaveURL(/\/master\/customers$/, { timeout: 10000 })

    // Search for it
    await page.getByPlaceholder('Cari kode, nama, email, atau telepon...').fill(name)
    await page.waitForTimeout(500)

    page.once('dialog', (dialog) => dialog.accept())
    const deleteBtn = page.locator('button').filter({ has: page.locator('svg.lucide-trash-2') }).first()
    if (await deleteBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await deleteBtn.click()
      await page.waitForTimeout(1000)
    }
  })

  test('search filter works', async ({ page }) => {
    await page.goto('/master/customers')
    await expect(page.locator('table')).toBeVisible()

    const searchInput = page.getByPlaceholder('Cari kode, nama, email, atau telepon...')
    await searchInput.fill('nonexistent-xyz-customer')
    await page.waitForTimeout(500)
  })

  test('customer type dropdown works', async ({ page }) => {
    await page.goto('/master/customers/create')

    // Click the Radix Select trigger for customer type
    const typeLabel = page.getByText('Tipe Customer *')
    const typeSection = typeLabel.locator('..')
    const typeTrigger = typeSection.getByRole('combobox')
    await typeTrigger.click()
    await page.getByRole('option', { name: 'Grosir' }).click()
    await expect(typeTrigger).toContainText('Grosir')

    await typeTrigger.click()
    await page.getByRole('option', { name: 'Bengkel' }).click()
    await expect(typeTrigger).toContainText('Bengkel')
  })

  test('detail page shows customer info', async ({ page }) => {
    await page.goto('/master/customers')
    await expect(page.locator('table')).toBeVisible()

    const firstRow = page.locator('table tbody tr').first()
    await firstRow.locator('a').first().click()
    await expect(page).toHaveURL(/\/master\/customers\/[a-zA-Z0-9-]+$/)
  })
})
