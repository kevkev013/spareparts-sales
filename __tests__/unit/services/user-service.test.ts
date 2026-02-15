import { describe, it, expect, vi, beforeEach } from 'vitest'
import { prismaMock } from '../../mocks/prisma'

vi.mock('@/lib/prisma', () => ({
  prisma: prismaMock,
}))

const mockHash = vi.fn().mockResolvedValue('$2a$12$hashed')
const mockCompare = vi.fn()

vi.mock('bcryptjs', () => ({
  default: {
    hash: (...args: any[]) => mockHash(...args),
    compare: (...args: any[]) => mockCompare(...args),
  },
}))

import {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  resetPassword,
  changePassword,
} from '@/services/user.service'

beforeEach(() => {
  vi.clearAllMocks()
  mockHash.mockResolvedValue('$2a$12$hashed')
})

// ============ getUsers ============

describe('getUsers', () => {
  it('returns users with pagination', async () => {
    prismaMock.user.count.mockResolvedValue(25)
    prismaMock.user.findMany.mockResolvedValue([
      { id: '1', username: 'user1', fullName: 'User One' } as any,
    ])

    const result = await getUsers({ page: 1, limit: 10 })
    expect(result.users).toHaveLength(1)
    expect(result.pagination.total).toBe(25)
    expect(result.pagination.totalPages).toBe(3)
  })

  it('applies search filter', async () => {
    prismaMock.user.count.mockResolvedValue(0)
    prismaMock.user.findMany.mockResolvedValue([])

    await getUsers({ search: 'john' })

    const countCall = prismaMock.user.count.mock.calls[0][0]
    expect(countCall?.where?.OR).toBeDefined()
    expect(countCall?.where?.OR).toHaveLength(3)
  })

  it('applies roleId filter', async () => {
    prismaMock.user.count.mockResolvedValue(0)
    prismaMock.user.findMany.mockResolvedValue([])

    await getUsers({ roleId: 'role-1' })

    const countCall = prismaMock.user.count.mock.calls[0][0]
    expect(countCall?.where?.roleId).toBe('role-1')
  })

  it('applies isActive filter', async () => {
    prismaMock.user.count.mockResolvedValue(0)
    prismaMock.user.findMany.mockResolvedValue([])

    await getUsers({ isActive: true })

    const countCall = prismaMock.user.count.mock.calls[0][0]
    expect(countCall?.where?.isActive).toBe(true)
  })

  it('defaults to page 1, limit 10', async () => {
    prismaMock.user.count.mockResolvedValue(0)
    prismaMock.user.findMany.mockResolvedValue([])

    const result = await getUsers({})
    expect(result.pagination.page).toBe(1)
    expect(result.pagination.limit).toBe(10)
  })

  it('calculates totalPages correctly', async () => {
    prismaMock.user.count.mockResolvedValue(21)
    prismaMock.user.findMany.mockResolvedValue([])

    const result = await getUsers({ limit: 10 })
    expect(result.pagination.totalPages).toBe(3) // Math.ceil(21/10)
  })
})

// ============ getUserById ============

describe('getUserById', () => {
  it('returns user with role info', async () => {
    const mockUser = {
      id: '1',
      username: 'admin',
      fullName: 'Admin',
      role: { id: 'r1', name: 'Admin' },
    }
    prismaMock.user.findUnique.mockResolvedValue(mockUser as any)

    const result = await getUserById('1')
    expect(result).toEqual(mockUser)
  })

  it('returns null for non-existent ID', async () => {
    prismaMock.user.findUnique.mockResolvedValue(null)

    const result = await getUserById('nonexistent')
    expect(result).toBeNull()
  })
})

// ============ createUser ============

describe('createUser', () => {
  const validInput = {
    username: 'newuser',
    password: 'password123',
    fullName: 'New User',
    email: 'new@example.com',
    roleId: 'role-1',
  }

  it('throws "Password harus diisi" when password is missing', async () => {
    await expect(createUser({ ...validInput, password: undefined })).rejects.toThrow(
      'Password harus diisi'
    )
  })

  it('throws "Username sudah digunakan" when username exists', async () => {
    prismaMock.user.findUnique.mockResolvedValue({ id: 'existing' } as any)

    await expect(createUser(validInput)).rejects.toThrow('Username sudah digunakan')
  })

  it('hashes password with bcrypt salt rounds 12', async () => {
    prismaMock.user.findUnique.mockResolvedValue(null)
    prismaMock.user.create.mockResolvedValue({ id: 'new-id' } as any)

    await createUser(validInput)
    expect(mockHash).toHaveBeenCalledWith('password123', 12)
  })

  it('creates user with correct data structure', async () => {
    prismaMock.user.findUnique.mockResolvedValue(null)
    prismaMock.user.create.mockResolvedValue({ id: 'new-id' } as any)

    await createUser(validInput)

    const createCall = prismaMock.user.create.mock.calls[0][0]
    expect(createCall.data).toMatchObject({
      username: 'newuser',
      passwordHash: '$2a$12$hashed',
      fullName: 'New User',
      email: 'new@example.com',
      roleId: 'role-1',
      isActive: true,
    })
  })

  it('returns the created user ID', async () => {
    prismaMock.user.findUnique.mockResolvedValue(null)
    prismaMock.user.create.mockResolvedValue({ id: 'new-user-id' } as any)

    const result = await createUser(validInput)
    expect(result).toBe('new-user-id')
  })

  it('defaults isActive to true when not provided', async () => {
    prismaMock.user.findUnique.mockResolvedValue(null)
    prismaMock.user.create.mockResolvedValue({ id: 'id' } as any)

    await createUser({ ...validInput, isActive: undefined })

    const createCall = prismaMock.user.create.mock.calls[0][0]
    expect(createCall.data.isActive).toBe(true)
  })
})

// ============ updateUser ============

describe('updateUser', () => {
  const existingUser = {
    id: 'user-1',
    username: 'existing',
    passwordHash: '$2a$12$old',
    fullName: 'Existing User',
  }

  it('throws "User tidak ditemukan" for non-existent user', async () => {
    prismaMock.user.findUnique.mockResolvedValue(null)

    await expect(
      updateUser('bad-id', {
        username: 'x',
        fullName: 'X',
        roleId: 'r1',
      })
    ).rejects.toThrow('User tidak ditemukan')
  })

  it('throws "Username sudah digunakan" when changing to existing username', async () => {
    prismaMock.user.findUnique
      .mockResolvedValueOnce(existingUser as any) // first call: find by id
      .mockResolvedValueOnce({ id: 'other' } as any) // second call: find by username

    await expect(
      updateUser('user-1', {
        username: 'taken',
        fullName: 'X',
        roleId: 'r1',
      })
    ).rejects.toThrow('Username sudah digunakan')
  })

  it('does NOT hash password when password field is empty', async () => {
    prismaMock.user.findUnique.mockResolvedValue(existingUser as any)
    prismaMock.user.update.mockResolvedValue({} as any)

    await updateUser('user-1', {
      username: 'existing',
      fullName: 'Updated',
      roleId: 'r1',
    })

    expect(mockHash).not.toHaveBeenCalled()
  })

  it('hashes password when password field is provided', async () => {
    prismaMock.user.findUnique.mockResolvedValue(existingUser as any)
    prismaMock.user.update.mockResolvedValue({} as any)

    await updateUser('user-1', {
      username: 'existing',
      password: 'newpass',
      fullName: 'Updated',
      roleId: 'r1',
    })

    expect(mockHash).toHaveBeenCalledWith('newpass', 12)
  })

  it('allows same username (no duplicate check against self)', async () => {
    prismaMock.user.findUnique.mockResolvedValue(existingUser as any)
    prismaMock.user.update.mockResolvedValue({} as any)

    await updateUser('user-1', {
      username: 'existing', // same as current
      fullName: 'Updated',
      roleId: 'r1',
    })

    // findUnique should only be called once (for finding by id), not twice
    expect(prismaMock.user.findUnique).toHaveBeenCalledTimes(1)
  })
})

// ============ deleteUser ============

describe('deleteUser', () => {
  it('throws "User tidak ditemukan" when user does not exist', async () => {
    prismaMock.user.findUnique.mockResolvedValue(null)

    await expect(deleteUser('bad-id')).rejects.toThrow('User tidak ditemukan')
  })

  it('throws error for system admin user', async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      id: 'admin-id',
      username: 'admin',
      role: { isSystem: true },
    } as any)

    await expect(deleteUser('admin-id')).rejects.toThrow(
      'Tidak dapat menghapus user admin utama'
    )
  })

  it('deletes non-admin user successfully', async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      id: 'user-1',
      username: 'regular',
      role: { isSystem: false },
    } as any)
    prismaMock.user.delete.mockResolvedValue({} as any)

    await deleteUser('user-1')
    expect(prismaMock.user.delete).toHaveBeenCalledWith({ where: { id: 'user-1' } })
  })

  it('allows deleting user with system role but non-admin username', async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      id: 'user-2',
      username: 'notadmin',
      role: { isSystem: true },
    } as any)
    prismaMock.user.delete.mockResolvedValue({} as any)

    await deleteUser('user-2')
    expect(prismaMock.user.delete).toHaveBeenCalled()
  })
})

// ============ resetPassword ============

describe('resetPassword', () => {
  it('throws when user not found', async () => {
    prismaMock.user.findUnique.mockResolvedValue(null)

    await expect(resetPassword('bad-id', 'newpass')).rejects.toThrow('User tidak ditemukan')
  })

  it('hashes new password and updates', async () => {
    prismaMock.user.findUnique.mockResolvedValue({ id: 'user-1' } as any)
    prismaMock.user.update.mockResolvedValue({} as any)

    await resetPassword('user-1', 'newpass123')

    expect(mockHash).toHaveBeenCalledWith('newpass123', 12)
    expect(prismaMock.user.update).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: { passwordHash: '$2a$12$hashed' },
    })
  })
})

// ============ changePassword ============

describe('changePassword', () => {
  it('throws when user not found', async () => {
    prismaMock.user.findUnique.mockResolvedValue(null)

    await expect(changePassword('bad-id', 'old', 'new')).rejects.toThrow(
      'User tidak ditemukan'
    )
  })

  it('throws "Password lama salah" when current password is wrong', async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      id: '1',
      passwordHash: '$2a$12$old',
    } as any)
    mockCompare.mockResolvedValue(false)

    await expect(changePassword('1', 'wrongpass', 'newpass')).rejects.toThrow(
      'Password lama salah'
    )
  })

  it('updates password hash when current password is correct', async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      id: '1',
      passwordHash: '$2a$12$old',
    } as any)
    mockCompare.mockResolvedValue(true)
    prismaMock.user.update.mockResolvedValue({} as any)

    await changePassword('1', 'correctpass', 'newpass')

    expect(mockCompare).toHaveBeenCalledWith('correctpass', '$2a$12$old')
    expect(mockHash).toHaveBeenCalledWith('newpass', 12)
    expect(prismaMock.user.update).toHaveBeenCalled()
  })
})
