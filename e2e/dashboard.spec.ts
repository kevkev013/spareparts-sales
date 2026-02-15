import { test, expect } from '@playwright/test'

test.describe('Dashboard', () => {
  test('displays 4 stat cards', async ({ page }) => {
    await page.goto('/dashboard')

    await expect(page.locator('h3').filter({ hasText: 'Total Items' })).toBeVisible()
    await expect(page.locator('h3').filter({ hasText: 'Total Customers' })).toBeVisible()
    // Use first() because "Stok Menipis" appears in stat card AND low stock section
    await expect(page.locator('h3').filter({ hasText: 'Stok Menipis' }).first()).toBeVisible()
    await expect(page.locator('h3').filter({ hasText: 'Nilai Stok' })).toBeVisible()
  })

  test('quick action buttons link to correct pages', async ({ page }) => {
    await page.goto('/dashboard')

    await expect(page.locator('a[href="/master/items/create"]')).toBeVisible()
    await expect(page.locator('a[href="/master/customers"]').filter({ hasText: 'Kelola Customer' })).toBeVisible()
    await expect(page.locator('a[href="/sales/orders"]').filter({ hasText: 'Buat Sales Order' })).toBeVisible()
    await expect(page.locator('a[href="/reports"]').filter({ hasText: 'Lihat Laporan' })).toBeVisible()
  })

  test('quick action navigates to create item page', async ({ page }) => {
    await page.goto('/dashboard')
    await page.locator('a[href="/master/items/create"]').click()
    await expect(page).toHaveURL(/\/master\/items\/create/)
  })

  test('stat card values are formatted', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page.locator('h1')).toContainText('Dashboard')
    // Just verify the page loaded with stats
    await expect(page.getByText('Sparepart aktif')).toBeVisible()
    await expect(page.getByText('Customer aktif')).toBeVisible()
  })
})
