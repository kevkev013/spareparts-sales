import { describe, it, expect } from 'vitest'
import {
  PERMISSION_MODULES,
  ALL_ACTIONS,
  ACTION_LABELS,
  getAllPermissionKeys,
  DEFAULT_ROLES,
} from '@/lib/permissions'

describe('PERMISSION_MODULES', () => {
  it('has exactly 15 modules', () => {
    expect(PERMISSION_MODULES).toHaveLength(15)
  })

  it('every module has a non-empty module string', () => {
    for (const mod of PERMISSION_MODULES) {
      expect(mod.module).toBeTruthy()
      expect(typeof mod.module).toBe('string')
    }
  })

  it('every module has a non-empty label string', () => {
    for (const mod of PERMISSION_MODULES) {
      expect(mod.label).toBeTruthy()
      expect(typeof mod.label).toBe('string')
    }
  })

  it('every module has at least one action', () => {
    for (const mod of PERMISSION_MODULES) {
      expect(mod.actions.length).toBeGreaterThanOrEqual(1)
    }
  })

  it('all module actions are from ALL_ACTIONS', () => {
    const validActions = new Set(ALL_ACTIONS)
    for (const mod of PERMISSION_MODULES) {
      for (const action of mod.actions) {
        expect(validActions.has(action)).toBe(true)
      }
    }
  })

  it('dashboard module has only view action', () => {
    const dashboard = PERMISSION_MODULES.find((m) => m.module === 'dashboard')
    expect(dashboard).toBeDefined()
    expect(dashboard!.actions).toEqual(['view'])
  })

  it('quotations module has 6 actions including approve', () => {
    const quotations = PERMISSION_MODULES.find((m) => m.module === 'quotations')
    expect(quotations).toBeDefined()
    expect(quotations!.actions).toHaveLength(6)
    expect(quotations!.actions).toContain('approve')
    expect(quotations!.actions).toContain('print')
  })
})

describe('ALL_ACTIONS', () => {
  it('contains exactly 6 actions', () => {
    expect(ALL_ACTIONS).toHaveLength(6)
  })

  it('contains view, create, edit, delete, print, approve', () => {
    expect(ALL_ACTIONS).toContain('view')
    expect(ALL_ACTIONS).toContain('create')
    expect(ALL_ACTIONS).toContain('edit')
    expect(ALL_ACTIONS).toContain('delete')
    expect(ALL_ACTIONS).toContain('print')
    expect(ALL_ACTIONS).toContain('approve')
  })
})

describe('ACTION_LABELS', () => {
  it('has a label for every action in ALL_ACTIONS', () => {
    for (const action of ALL_ACTIONS) {
      expect(ACTION_LABELS[action]).toBeDefined()
    }
  })

  it('all values are non-empty strings', () => {
    for (const key of Object.keys(ACTION_LABELS)) {
      expect(typeof ACTION_LABELS[key]).toBe('string')
      expect(ACTION_LABELS[key].length).toBeGreaterThan(0)
    }
  })
})

describe('getAllPermissionKeys', () => {
  it('returns an array of strings', () => {
    const keys = getAllPermissionKeys()
    expect(Array.isArray(keys)).toBe(true)
    for (const key of keys) {
      expect(typeof key).toBe('string')
    }
  })

  it('every key matches pattern "module.action"', () => {
    const keys = getAllPermissionKeys()
    for (const key of keys) {
      expect(key).toMatch(/^\w+\.\w+$/)
    }
  })

  it('returns correct total count', () => {
    // dashboard(1) + items(4) + customers(4) + locations(4) + batches(4) +
    // quotations(6) + orders(5) + delivery_orders(4) + shipments(4) + invoices(3) +
    // payments(4) + returns(5) + reports(1) + users(4) + roles(4) = 57
    const keys = getAllPermissionKeys()
    expect(keys).toHaveLength(57)
  })

  it('contains specific known keys', () => {
    const keys = getAllPermissionKeys()
    expect(keys).toContain('items.view')
    expect(keys).toContain('quotations.approve')
    expect(keys).toContain('roles.delete')
    expect(keys).toContain('dashboard.view')
  })

  it('does not contain invalid keys', () => {
    const keys = getAllPermissionKeys()
    expect(keys).not.toContain('nonexistent.view')
    expect(keys).not.toContain('items.approve')
  })
})

describe('DEFAULT_ROLES', () => {
  it('has exactly 6 roles', () => {
    expect(DEFAULT_ROLES).toHaveLength(6)
  })

  it('Admin role has isSystem=true', () => {
    const admin = DEFAULT_ROLES.find((r) => r.name === 'Admin')
    expect(admin).toBeDefined()
    expect(admin!.isSystem).toBe(true)
  })

  it('Admin role has ALL permissions set to true', () => {
    const admin = DEFAULT_ROLES.find((r) => r.name === 'Admin')!
    const allKeys = getAllPermissionKeys()
    for (const key of allKeys) {
      expect(admin.permissions[key]).toBe(true)
    }
  })

  it('Admin role permissions count equals getAllPermissionKeys count', () => {
    const admin = DEFAULT_ROLES.find((r) => r.name === 'Admin')!
    const allKeys = getAllPermissionKeys()
    const adminKeyCount = Object.keys(admin.permissions).filter(
      (k) => admin.permissions[k] === true
    ).length
    expect(adminKeyCount).toBe(allKeys.length)
  })

  it('Non-admin roles have isSystem=false', () => {
    const nonAdmin = DEFAULT_ROLES.filter((r) => r.name !== 'Admin')
    for (const role of nonAdmin) {
      expect(role.isSystem).toBe(false)
    }
  })

  it('Viewer role only has .view permissions', () => {
    const viewer = DEFAULT_ROLES.find((r) => r.name === 'Viewer')!
    const activeKeys = Object.keys(viewer.permissions).filter((k) => viewer.permissions[k] === true)
    for (const key of activeKeys) {
      expect(key).toMatch(/\.view$/)
    }
  })

  it('Sales role includes quotations.create but NOT users.view', () => {
    const sales = DEFAULT_ROLES.find((r) => r.name === 'Sales')!
    expect(sales.permissions['quotations.create']).toBe(true)
    expect(sales.permissions['users.view']).toBeUndefined()
  })

  it('Manager role includes quotations.approve', () => {
    const manager = DEFAULT_ROLES.find((r) => r.name === 'Manager')!
    expect(manager.permissions['quotations.approve']).toBe(true)
  })

  it('every role has a non-empty name and description', () => {
    for (const role of DEFAULT_ROLES) {
      expect(role.name).toBeTruthy()
      expect(role.description).toBeTruthy()
    }
  })
})
