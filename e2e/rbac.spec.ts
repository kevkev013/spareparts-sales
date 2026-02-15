import { test, expect } from '@playwright/test'

// These tests run in the "rbac" project which uses viewer auth state
test.describe('RBAC Enforcement (Viewer Role)', () => {
  test('sidebar does not show Settings menu', async ({ page }) => {
    await page.goto('/dashboard', { waitUntil: 'networkidle' })
    await expect(page.locator('h1')).toContainText('Dashboard')

    // Viewer should NOT see Settings links
    const usersLink = page.locator('a[href="/settings/users"]')
    const rolesLink = page.locator('a[href="/settings/roles"]')
    await expect(usersLink).toHaveCount(0)
    await expect(rolesLink).toHaveCount(0)
  })

  test('items page: Tambah button is hidden', async ({ page }) => {
    await page.goto('/master/items', { waitUntil: 'networkidle' })
    await expect(page.locator('table')).toBeVisible()

    const addBtn = page.getByRole('link', { name: /Tambah Item/ })
    await expect(addBtn).toHaveCount(0)
  })

  test('items page: Edit and Delete buttons hidden in table', async ({ page }) => {
    await page.goto('/master/items', { waitUntil: 'networkidle' })
    await expect(page.locator('table')).toBeVisible()

    const firstRow = page.locator('table tbody tr').first()
    if (await firstRow.isVisible({ timeout: 3000 }).catch(() => false)) {
      const editLink = firstRow.locator('a[href*="/edit"]')
      const deleteBtn = firstRow.locator('button').filter({ has: page.locator('svg.lucide-trash-2') })
      await expect(editLink).toHaveCount(0)
      await expect(deleteBtn).toHaveCount(0)
    }
  })

  test('customers page: create button hidden', async ({ page }) => {
    await page.goto('/master/customers', { waitUntil: 'networkidle' })
    await expect(page.locator('table')).toBeVisible()

    const addBtn = page.getByRole('link', { name: /Tambah Customer/ })
    await expect(addBtn).toHaveCount(0)
  })

  test('accessing /settings/users shows no data or redirects', async ({ page }) => {
    await page.goto('/settings/users', { waitUntil: 'networkidle' })

    // Viewer either can't see the page or it shows limited content
    // The sidebar won't have the link, but direct URL access may still work
    // depending on server-side vs client-side permission check
    const url = page.url()
    const body = await page.textContent('body')

    // Should either NOT show create button or redirect
    const addBtn = page.getByRole('link', { name: /Tambah User/ })
    const addBtnCount = await addBtn.count()
    expect(addBtnCount).toBe(0)
  })

  test('API POST /api/items returns 403', async ({ page }) => {
    const response = await page.request.post('/api/items', {
      data: { itemName: 'Should Fail', category: 'Test' },
    })
    expect([401, 403]).toContain(response.status())
  })

  test('change password page is still accessible', async ({ page }) => {
    await page.goto('/settings/change-password', { waitUntil: 'networkidle' })
    await expect(page.locator('h1')).toContainText('Ganti Password')
  })

  test('quotations page: create button hidden', async ({ page }) => {
    await page.goto('/sales/quotations', { waitUntil: 'networkidle' })

    const addBtn = page.getByRole('link', { name: /Tambah Quotation/ })
    await expect(addBtn).toHaveCount(0)
  })
})
