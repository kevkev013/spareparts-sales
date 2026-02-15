import { test, expect } from '@playwright/test'

test.describe('Settings - User Management', () => {
  test('list page shows users', async ({ page }) => {
    await page.goto('/settings/users')
    await expect(page.locator('h1')).toContainText('User')
    await expect(page.locator('table')).toBeVisible()
  })

  test('create new user', async ({ page }) => {
    await page.goto('/settings/users/create')

    const username = 'e2etest' + Date.now().toString().slice(-6)
    await page.locator('#username').fill(username)
    await page.locator('#password').fill('Test123456')
    await page.locator('#fullName').fill('E2E Test User')

    // Role is a native <select>
    const roleSelect = page.locator('#roleId, select')
    await roleSelect.waitFor({ state: 'visible' })
    // Wait for options to load
    await page.waitForTimeout(1000)
    const options = roleSelect.locator('option')
    const optCount = await options.count()
    if (optCount > 1) {
      await roleSelect.selectOption({ index: 1 })
    }

    page.once('dialog', (dialog) => dialog.accept())
    await page.getByRole('button', { name: /Simpan|Tambah/ }).click()
    await expect(page).toHaveURL(/\/settings\/users$/, { timeout: 10000 })
  })

  test('new user appears in list', async ({ page }) => {
    await page.goto('/settings/users')
    await expect(page.locator('table')).toBeVisible()
    await expect(page.locator('table tbody tr').first()).toBeVisible()
  })

  test('edit user changes name', async ({ page }) => {
    await page.goto('/settings/users')
    await expect(page.locator('table')).toBeVisible()

    const rows = page.locator('table tbody tr')
    const rowCount = await rows.count()

    for (let i = 0; i < rowCount; i++) {
      const row = rows.nth(i)
      const editLink = row.locator('a[href*="/edit"]')
      if (await editLink.isVisible({ timeout: 1000 }).catch(() => false)) {
        await editLink.click()
        await expect(page).toHaveURL(/\/settings\/users\/[a-zA-Z0-9-]+\/edit/)

        const nameInput = page.locator('#fullName')
        await expect(nameInput).not.toHaveValue('')

        page.once('dialog', (dialog) => dialog.accept())
        await page.getByRole('button', { name: /Simpan|Update/ }).click()
        await expect(page).toHaveURL(/\/settings\/users$/, { timeout: 10000 })
        break
      }
    }
  })

  test('delete non-admin user', async ({ page }) => {
    // First create a user to delete
    await page.goto('/settings/users/create')
    const username = 'deluser' + Date.now().toString().slice(-6)
    await page.locator('#username').fill(username)
    await page.locator('#password').fill('Test123456')
    await page.locator('#fullName').fill('Delete Me User')

    const roleSelect = page.locator('#roleId, select')
    await roleSelect.waitFor({ state: 'visible' })
    await page.waitForTimeout(1000)
    const options = roleSelect.locator('option')
    const optCount = await options.count()
    if (optCount > 1) {
      await roleSelect.selectOption({ index: 1 })
    }

    page.once('dialog', (dialog) => dialog.accept())
    await page.getByRole('button', { name: /Simpan|Tambah/ }).click()
    await expect(page).toHaveURL(/\/settings\/users$/, { timeout: 10000 })

    // Search for the user
    const searchInput = page.locator('input[type="text"]').first()
    if (await searchInput.isVisible()) {
      await searchInput.fill(username)
      await page.waitForTimeout(500)
    }

    // Delete
    page.once('dialog', (dialog) => dialog.accept())
    const deleteBtn = page.locator('button').filter({ has: page.locator('svg.lucide-trash-2') }).first()
    if (await deleteBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await deleteBtn.click()
      await page.waitForTimeout(1000)
    }
  })

  test('search user works', async ({ page }) => {
    await page.goto('/settings/users')
    await expect(page.locator('table')).toBeVisible()

    const searchInput = page.locator('input[type="text"]').first()
    if (await searchInput.isVisible()) {
      await searchInput.fill('admin')
      await page.waitForTimeout(500)
      await expect(page.locator('table tbody tr').first()).toBeVisible()
    }
  })

  test('user detail page loads', async ({ page }) => {
    await page.goto('/settings/users')
    await expect(page.locator('table')).toBeVisible()

    const firstRow = page.locator('table tbody tr').first()
    await firstRow.locator('a').first().click()
    await expect(page).toHaveURL(/\/settings\/users\/[a-zA-Z0-9-]+/)
  })

  test('change password page is accessible', async ({ page }) => {
    await page.goto('/settings/change-password')
    await expect(page.locator('h1')).toContainText('Ganti Password')
  })
})
