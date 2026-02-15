import { test as setup, expect } from '@playwright/test'

const ADMIN_USER = { username: 'admin', password: 'admin123' }

async function login(page: any, username: string, password: string) {
  await page.goto('/login', { waitUntil: 'networkidle' })
  await page.locator('#username').click()
  await page.locator('#username').fill(username)
  await page.locator('#password').click()
  await page.locator('#password').fill(password)

  // Click login and wait for either navigation or error
  await Promise.all([
    page.waitForURL('**/dashboard', { timeout: 20000 }),
    page.locator('button[type="submit"]').click(),
  ])
}

setup('authenticate as admin', async ({ page }) => {
  setup.setTimeout(60000)
  // Retry login up to 3 times (server might be cold starting)
  let lastError: Error | null = null
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      await login(page, ADMIN_USER.username, ADMIN_USER.password)
      await expect(page.locator('h1')).toContainText('Dashboard')
      await page.context().storageState({ path: 'e2e/.auth/admin.json' })
      return
    } catch (e) {
      lastError = e as Error
      console.log(`Admin login attempt ${attempt + 1} failed, retrying...`)
      await page.waitForTimeout(2000)
    }
  }
  throw lastError
})

setup('authenticate as viewer', async ({ page }) => {
  setup.setTimeout(60000)
  // Try logging in as viewer
  await page.goto('/login', { waitUntil: 'networkidle' })
  await page.locator('#username').fill('viewer')
  await page.locator('#password').fill('viewer123')
  await page.locator('button[type="submit"]').click()

  // Wait and check if login succeeded or failed
  try {
    await page.waitForURL('**/dashboard', { timeout: 10000 })
  } catch {
    // Login failed - create viewer user via admin session
    await login(page, ADMIN_USER.username, ADMIN_USER.password)

    // Get roles to find a viewer-like role
    const rolesRes = await page.request.get('/api/roles')
    const roles = await rolesRes.json()
    let viewerRoleId = roles.find((r: any) => r.name.toLowerCase().includes('viewer'))?.id

    if (!viewerRoleId) {
      const permissions: Record<string, boolean> = {}
      const modules = [
        'dashboard', 'items', 'customers', 'locations', 'batches',
        'quotations', 'orders', 'delivery_orders', 'shipments',
        'invoices', 'payments', 'returns', 'reports',
      ]
      for (const mod of modules) {
        permissions[`${mod}.view`] = true
      }
      const createRoleRes = await page.request.post('/api/roles', {
        data: { name: 'Viewer', description: 'View only role', permissions },
      })
      const roleData = await createRoleRes.json()
      viewerRoleId = roleData.id
    }

    await page.request.post('/api/users', {
      data: {
        username: 'viewer',
        password: 'viewer123',
        fullName: 'Viewer Test',
        roleId: viewerRoleId,
      },
    })

    // Now login as viewer
    await page.goto('/login', { waitUntil: 'networkidle' })
    await page.locator('#username').fill('viewer')
    await page.locator('#password').fill('viewer123')
    await Promise.all([
      page.waitForURL('**/dashboard', { timeout: 15000 }),
      page.locator('button[type="submit"]').click(),
    ])
  }

  await page.context().storageState({ path: 'e2e/.auth/viewer.json' })
})
