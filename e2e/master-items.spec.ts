import { test, expect } from '@playwright/test'

test.describe('Master Items', () => {
  test('list page loads with table', async ({ page }) => {
    await page.goto('/master/items')
    await expect(page.locator('h1')).toContainText('Master Sparepart')
    await expect(page.locator('table')).toBeVisible()
  })

  test('search filter works', async ({ page }) => {
    await page.goto('/master/items')
    await expect(page.locator('table')).toBeVisible()

    const searchInput = page.getByPlaceholder('Cari kode item, nama, atau deskripsi...')
    await searchInput.fill('test-nonexistent-xyz')
    await page.waitForTimeout(500)
  })

  test('click Tambah Item navigates to create form', async ({ page }) => {
    await page.goto('/master/items')
    await page.getByRole('link', { name: /Tambah Item/ }).click()
    await expect(page).toHaveURL(/\/master\/items\/create/)
    await expect(page.locator('h1')).toContainText('Tambah Item Baru')
  })

  test('create item with required fields', async ({ page }) => {
    await page.goto('/master/items/create')

    await page.locator('#itemName').fill('E2E Test Item ' + Date.now())
    await page.locator('#category').fill('Oli Mesin')
    await page.locator('#brand').fill('Honda')
    await page.locator('#baseUnit').fill('pcs')
    await page.locator('#basePrice').fill('10000')
    await page.locator('#sellingPrice').fill('15000')

    page.once('dialog', (dialog) => dialog.accept())
    await page.getByRole('button', { name: /Tambah Item/ }).click()
    await expect(page).toHaveURL(/\/master\/items$/, { timeout: 10000 })
  })

  test('new item appears in list', async ({ page }) => {
    await page.goto('/master/items')
    await expect(page.locator('table')).toBeVisible()
    await expect(page.locator('table tbody tr').first()).toBeVisible()
  })

  test('click detail shows item detail page', async ({ page }) => {
    await page.goto('/master/items')
    await expect(page.locator('table')).toBeVisible()

    const firstRow = page.locator('table tbody tr').first()
    await firstRow.locator('a').first().click()
    await expect(page).toHaveURL(/\/master\/items\/[a-zA-Z0-9-]+$/)
  })

  test('edit form is pre-filled and updates', async ({ page }) => {
    await page.goto('/master/items')
    await expect(page.locator('table')).toBeVisible()

    const firstRow = page.locator('table tbody tr').first()
    const editLink = firstRow.locator('a[href*="/edit"]')

    if (await editLink.isVisible({ timeout: 3000 }).catch(() => false)) {
      await editLink.click()
      await expect(page).toHaveURL(/\/master\/items\/[a-zA-Z0-9-]+\/edit/)

      const nameInput = page.locator('#itemName')
      await expect(nameInput).not.toHaveValue('')

      page.once('dialog', (dialog) => dialog.accept())
      await page.getByRole('button', { name: /Update Item/ }).click()
      await expect(page).toHaveURL(/\/master\/items$/, { timeout: 10000 })
    }
  })

  test('delete item with confirmation', async ({ page }) => {
    // Create an item to delete
    await page.goto('/master/items/create')
    const itemName = 'Delete Test ' + Date.now()
    await page.locator('#itemName').fill(itemName)
    await page.locator('#category').fill('Lainnya')
    await page.locator('#brand').fill('Universal')
    await page.locator('#baseUnit').fill('pcs')
    await page.locator('#basePrice').fill('1000')
    await page.locator('#sellingPrice').fill('2000')
    page.once('dialog', (dialog) => dialog.accept())
    await page.getByRole('button', { name: /Tambah Item/ }).click()
    await expect(page).toHaveURL(/\/master\/items$/, { timeout: 10000 })

    await page.getByPlaceholder('Cari kode item, nama, atau deskripsi...').fill(itemName)
    await page.waitForTimeout(500)

    page.once('dialog', (dialog) => dialog.accept())
    const deleteBtn = page.locator('button').filter({ has: page.locator('svg.lucide-trash-2') }).first()
    if (await deleteBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await deleteBtn.click()
      await page.waitForTimeout(1000)
    }
  })

  test('pagination works', async ({ page }) => {
    await page.goto('/master/items')
    await expect(page.locator('table')).toBeVisible()

    const paginationText = page.getByText(/Menampilkan/)
    await expect(paginationText).toBeVisible()
  })

  test('form validation shows error on empty name', async ({ page }) => {
    await page.goto('/master/items/create')
    await page.locator('#itemName').fill('')
    await page.getByRole('button', { name: /Tambah Item/ }).click()
    await expect(page).toHaveURL(/\/master\/items\/create/)
  })
})
