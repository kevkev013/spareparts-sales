import { test, expect } from '@playwright/test'

test.describe('Reports Page', () => {
  test('page loads with title', async ({ page }) => {
    await page.goto('/reports')
    await expect(page.locator('h1')).toContainText('Laporan')
    await expect(page.getByText('Ringkasan data penjualan')).toBeVisible()
  })

  test('revenue cards are visible', async ({ page }) => {
    await page.goto('/reports')

    // 4 top cards
    await expect(page.getByText('Total Revenue')).toBeVisible()
    await expect(page.getByText('Total Profit')).toBeVisible()
    await expect(page.getByText('Total Dibayar')).toBeVisible()
    await expect(page.getByText('Piutang')).toBeVisible()
  })

  test('sales summary section visible', async ({ page }) => {
    await page.goto('/reports')

    await expect(page.getByText('Ringkasan Penjualan')).toBeVisible()
    await expect(page.getByText('Total Quotation')).toBeVisible()
    await expect(page.getByText('Total Sales Order')).toBeVisible()
    await expect(page.getByText('Pengiriman')).toBeVisible()
  })

  test('invoice status section visible', async ({ page }) => {
    await page.goto('/reports')

    await expect(page.getByText('Status Invoice')).toBeVisible()
    await expect(page.getByText('HPP (Harga Pokok)')).toBeVisible()
    await expect(page.getByText('Lunas')).toBeVisible()
    await expect(page.getByText('Belum Dibayar')).toBeVisible()
    await expect(page.getByText('Jatuh Tempo', { exact: true })).toBeVisible()
  })

  test('inventory summary section visible', async ({ page }) => {
    await page.goto('/reports')

    await expect(page.getByText('Ringkasan Inventory')).toBeVisible()
    await expect(page.getByText('Total Item')).toBeVisible()
    await expect(page.getByText('Stok Menipis')).toBeVisible()
    await expect(page.getByText('Stok Habis')).toBeVisible()
    await expect(page.getByText('Nilai Stok (Harga Beli)')).toBeVisible()
    await expect(page.getByText('Potensi Keuntungan')).toBeVisible()
  })

  test('top customers section visible', async ({ page }) => {
    await page.goto('/reports')
    await expect(page.getByText('Top 5 Customer')).toBeVisible()
  })

  test('top items section visible', async ({ page }) => {
    await page.goto('/reports')
    await expect(page.getByText('Top 5 Item Terlaris')).toBeVisible()
  })

  test('recent orders section visible', async ({ page }) => {
    await page.goto('/reports')
    await expect(page.getByText('Order Terbaru')).toBeVisible()
  })

  test('currency values are formatted in Rp', async ({ page }) => {
    await page.goto('/reports')

    // All currency values should show "Rp" format
    const rpValues = page.locator('text=/Rp/')
    const count = await rpValues.count()
    expect(count).toBeGreaterThan(0)
  })
})
