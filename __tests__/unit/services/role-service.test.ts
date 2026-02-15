import { describe, it, expect, vi, beforeEach } from 'vitest'
import { prismaMock } from '../../mocks/prisma'

vi.mock('@/lib/prisma', () => ({
  prisma: prismaMock,
}))

vi.mock('bcryptjs', () => ({
  default: {
    hash: vi.fn().mockResolvedValue('$2a$12$hashed'),
    compare: vi.fn(),
  },
}))

import {
  getRoles,
  getRoleById,
  createRole,
  updateRole,
  deleteRole,
} from '@/services/user.service'

beforeEach(() => {
  vi.clearAllMocks()
})

// ============ getRoles ============

describe('getRoles', () => {
  it('returns roles ordered by name ascending', async () => {
    const mockRoles = [
      { id: '1', name: 'Admin', _count: { users: 2 } },
      { id: '2', name: 'Sales', _count: { users: 5 } },
    ]
    prismaMock.role.findMany.mockResolvedValue(mockRoles as any)

    const result = await getRoles()
    expect(result).toEqual(mockRoles)

    const findCall = prismaMock.role.findMany.mock.calls[0][0]
    expect(findCall?.orderBy).toEqual({ name: 'asc' })
  })

  it('includes user count in select', async () => {
    prismaMock.role.findMany.mockResolvedValue([])

    await getRoles()

    const findCall = prismaMock.role.findMany.mock.calls[0][0]
    expect(findCall?.select?._count).toEqual({ select: { users: true } })
  })
})

// ============ getRoleById ============

describe('getRoleById', () => {
  it('returns role with user count', async () => {
    const mockRole = {
      id: '1',
      name: 'Admin',
      permissions: { 'items.view': true },
      _count: { users: 3 },
    }
    prismaMock.role.findUnique.mockResolvedValue(mockRole as any)

    const result = await getRoleById('1')
    expect(result).toEqual(mockRole)
  })

  it('returns null for non-existent ID', async () => {
    prismaMock.role.findUnique.mockResolvedValue(null)

    const result = await getRoleById('nonexistent')
    expect(result).toBeNull()
  })
})

// ============ createRole ============

describe('createRole', () => {
  it('throws "Nama role sudah digunakan" for duplicate name', async () => {
    prismaMock.role.findUnique.mockResolvedValue({ id: 'existing' } as any)

    await expect(
      createRole({ name: 'Admin', permissions: {} })
    ).rejects.toThrow('Nama role sudah digunakan')
  })

  it('creates role with permissions object', async () => {
    prismaMock.role.findUnique.mockResolvedValue(null)
    prismaMock.role.create.mockResolvedValue({ id: 'new-role' } as any)

    const permissions = { 'items.view': true, 'items.create': true }
    await createRole({ name: 'Custom', description: 'Test role', permissions })

    const createCall = prismaMock.role.create.mock.calls[0][0]
    expect(createCall.data.name).toBe('Custom')
    expect(createCall.data.description).toBe('Test role')
    expect(createCall.data.permissions).toEqual(permissions)
  })

  it('returns the created role ID', async () => {
    prismaMock.role.findUnique.mockResolvedValue(null)
    prismaMock.role.create.mockResolvedValue({ id: 'role-123' } as any)

    const result = await createRole({ name: 'New', permissions: {} })
    expect(result).toBe('role-123')
  })
})

// ============ updateRole ============

describe('updateRole', () => {
  const existingRole = {
    id: 'role-1',
    name: 'Sales',
    isSystem: false,
    permissions: { 'items.view': true },
  }

  it('throws "Role tidak ditemukan" when role does not exist', async () => {
    prismaMock.role.findUnique.mockResolvedValue(null)

    await expect(
      updateRole('bad-id', { name: 'X', permissions: {} })
    ).rejects.toThrow('Role tidak ditemukan')
  })

  it('throws "Nama role sudah digunakan" when renaming to existing name', async () => {
    prismaMock.role.findUnique
      .mockResolvedValueOnce(existingRole as any) // find by id
      .mockResolvedValueOnce({ id: 'other' } as any) // find by name

    await expect(
      updateRole('role-1', { name: 'TakenName', permissions: {} })
    ).rejects.toThrow('Nama role sudah digunakan')
  })

  it('allows keeping the same name', async () => {
    prismaMock.role.findUnique.mockResolvedValue(existingRole as any)
    prismaMock.role.update.mockResolvedValue({} as any)

    await updateRole('role-1', { name: 'Sales', permissions: { 'items.view': true } })

    // findUnique called only once (by id, not by name)
    expect(prismaMock.role.findUnique).toHaveBeenCalledTimes(1)
  })

  it('does NOT update name for system roles', async () => {
    const systemRole = { ...existingRole, isSystem: true, name: 'Admin' }
    prismaMock.role.findUnique
      .mockResolvedValueOnce(systemRole as any) // find by id
      .mockResolvedValueOnce(null as any) // find by name (not taken)
    prismaMock.role.update.mockResolvedValue({} as any)

    await updateRole('role-1', { name: 'NewAdminName', permissions: {} })

    const updateCall = prismaMock.role.update.mock.calls[0][0]
    expect(updateCall.data.name).toBe('Admin') // preserves original
  })

  it('DOES update permissions for system roles', async () => {
    const systemRole = { ...existingRole, isSystem: true, name: 'Admin' }
    prismaMock.role.findUnique.mockResolvedValue(systemRole as any)
    prismaMock.role.update.mockResolvedValue({} as any)

    const newPerms = { 'items.view': true, 'items.create': true }
    await updateRole('role-1', { name: 'Admin', permissions: newPerms })

    const updateCall = prismaMock.role.update.mock.calls[0][0]
    expect(updateCall.data.permissions).toEqual(newPerms)
  })

  it('DOES update description for system roles', async () => {
    const systemRole = { ...existingRole, isSystem: true, name: 'Admin' }
    prismaMock.role.findUnique.mockResolvedValue(systemRole as any)
    prismaMock.role.update.mockResolvedValue({} as any)

    await updateRole('role-1', {
      name: 'Admin',
      description: 'New desc',
      permissions: {},
    })

    const updateCall = prismaMock.role.update.mock.calls[0][0]
    expect(updateCall.data.description).toBe('New desc')
  })

  it('updates name for non-system roles', async () => {
    prismaMock.role.findUnique.mockResolvedValue(existingRole as any)
    prismaMock.role.update.mockResolvedValue({} as any)

    await updateRole('role-1', { name: 'Sales', permissions: {} })

    const updateCall = prismaMock.role.update.mock.calls[0][0]
    expect(updateCall.data.name).toBe('Sales')
  })
})

// ============ deleteRole ============

describe('deleteRole', () => {
  it('throws "Role tidak ditemukan" when role does not exist', async () => {
    prismaMock.role.findUnique.mockResolvedValue(null)

    await expect(deleteRole('bad-id')).rejects.toThrow('Role tidak ditemukan')
  })

  it('throws "Tidak dapat menghapus role sistem" for system roles', async () => {
    prismaMock.role.findUnique.mockResolvedValue({
      id: '1',
      isSystem: true,
      _count: { users: 0 },
    } as any)

    await expect(deleteRole('1')).rejects.toThrow('Tidak dapat menghapus role sistem')
  })

  it('throws error when role has users', async () => {
    prismaMock.role.findUnique.mockResolvedValue({
      id: '1',
      isSystem: false,
      _count: { users: 3 },
    } as any)

    await expect(deleteRole('1')).rejects.toThrow(
      'Tidak dapat menghapus role yang masih memiliki user'
    )
  })

  it('deletes non-system role with zero users', async () => {
    prismaMock.role.findUnique.mockResolvedValue({
      id: '1',
      isSystem: false,
      _count: { users: 0 },
    } as any)
    prismaMock.role.delete.mockResolvedValue({} as any)

    await deleteRole('1')
    expect(prismaMock.role.delete).toHaveBeenCalledWith({ where: { id: '1' } })
  })
})
