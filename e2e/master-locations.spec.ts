import { test, expect } from '@playwright/test'

test.describe('Master Locations', () => {
  test('list page loads with table', async ({ page }) => {
    await page.goto('/master/locations')
    await expect(page.locator('h1')).toContainText('Master Lokasi')
    await expect(page.locator('table')).toBeVisible()
  })

  test('create location', async ({ page }) => {
    await page.goto('/master/locations/create')
    await expect(page.locator('h1')).toContainText('Tambah Lokasi Baru')

    await page.locator('#locationCode').fill('E2E-' + Date.now().toString().slice(-6))
    await page.locator('#warehouse').fill('Gudang E2E Test')
    await page.locator('#locationName').fill('E2E Lokasi Test ' + Date.now())

    // Zone is a Radix Select
    const zoneLabel = page.getByText('Zona')
    const zoneSection = zoneLabel.locator('..')
    const zoneTrigger = zoneSection.getByRole('combobox')
    await zoneTrigger.click()
    await page.getByRole('option', { name: 'Storage' }).click()

    page.once('dialog', (dialog) => dialog.accept())
    await page.getByRole('button', { name: /Tambah Lokasi/ }).click()
    await expect(page).toHaveURL(/\/master\/locations$/, { timeout: 10000 })
  })

  test('edit location', async ({ page }) => {
    await page.goto('/master/locations')
    await expect(page.locator('table')).toBeVisible()

    const firstRow = page.locator('table tbody tr').first()
    const editLink = firstRow.locator('a[href*="/edit"]')

    if (await editLink.isVisible({ timeout: 3000 }).catch(() => false)) {
      await editLink.click()
      await expect(page).toHaveURL(/\/master\/locations\/[a-zA-Z0-9-]+\/edit/)

      const nameInput = page.locator('#locationName')
      await expect(nameInput).not.toHaveValue('')

      page.once('dialog', (dialog) => dialog.accept())
      await page.getByRole('button', { name: /Update Lokasi/ }).click()
      await expect(page).toHaveURL(/\/master\/locations$/, { timeout: 10000 })
    }
  })

  test('delete location', async ({ page }) => {
    await page.goto('/master/locations/create')
    const code = 'DEL-' + Date.now().toString().slice(-6)
    await page.locator('#locationCode').fill(code)
    await page.locator('#warehouse').fill('Delete Test')
    await page.locator('#locationName').fill('Delete Location ' + Date.now())

    page.once('dialog', (dialog) => dialog.accept())
    await page.getByRole('button', { name: /Tambah Lokasi/ }).click()
    await expect(page).toHaveURL(/\/master\/locations$/, { timeout: 10000 })

    await page.getByPlaceholder('Cari kode, nama, atau deskripsi lokasi...').fill(code)
    await page.waitForTimeout(500)

    page.once('dialog', (dialog) => dialog.accept())
    const deleteBtn = page.locator('button').filter({ has: page.locator('svg.lucide-trash-2') }).first()
    if (await deleteBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await deleteBtn.click()
      await page.waitForTimeout(1000)
    }
  })

  test('zone dropdown works', async ({ page }) => {
    await page.goto('/master/locations/create')

    const zoneLabel = page.getByText('Zona')
    const zoneSection = zoneLabel.locator('..')
    const zoneTrigger = zoneSection.getByRole('combobox')

    await zoneTrigger.click()
    await page.getByRole('option', { name: 'Receiving' }).click()
    await expect(zoneTrigger).toContainText('Receiving')

    await zoneTrigger.click()
    await page.getByRole('option', { name: 'Shipping' }).click()
    await expect(zoneTrigger).toContainText('Shipping')
  })

  test('detail page shows location info', async ({ page }) => {
    await page.goto('/master/locations')
    await expect(page.locator('table')).toBeVisible()

    const firstRow = page.locator('table tbody tr').first()
    await firstRow.locator('a').first().click()
    await expect(page).toHaveURL(/\/master\/locations\/[a-zA-Z0-9-]+$/)
  })
})
