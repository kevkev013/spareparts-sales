import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { Prisma } from '@prisma/client'

function validatePassword(password: string) {
  if (password.length < 8) throw new Error('Password minimal 8 karakter')
  if (password.length > 72) throw new Error('Password maksimal 72 karakter')
  if (!/[a-z]/.test(password)) throw new Error('Password harus mengandung huruf kecil')
  if (!/[A-Z]/.test(password)) throw new Error('Password harus mengandung huruf besar')
  if (!/[0-9]/.test(password)) throw new Error('Password harus mengandung angka')
}

export type UserFilter = {
  search?: string
  roleId?: string
  isActive?: boolean
  page?: number
  limit?: number
}

export type UserInput = {
  username: string
  password?: string
  fullName: string
  email?: string
  roleId: string
  isActive?: boolean
}

/**
 * Get list of users
 */
export async function getUsers(filter: UserFilter) {
  const { search, roleId, isActive, page = 1, limit = 10 } = filter
  const skip = (page - 1) * limit

  const where: Prisma.UserWhereInput = {}

  if (search) {
    where.OR = [
      { username: { contains: search, mode: 'insensitive' } },
      { fullName: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
    ]
  }

  if (roleId) where.roleId = roleId
  if (isActive !== undefined) where.isActive = isActive

  const total = await prisma.user.count({ where })

  const users = await prisma.user.findMany({
    where,
    skip,
    take: limit,
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      username: true,
      fullName: true,
      email: true,
      isActive: true,
      lastLoginAt: true,
      createdAt: true,
      role: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  })

  return {
    users,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  }
}

/**
 * Get user by ID
 */
export async function getUserById(id: string) {
  return prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      username: true,
      fullName: true,
      email: true,
      roleId: true,
      isActive: true,
      lastLoginAt: true,
      createdAt: true,
      role: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  })
}

/**
 * Create user
 */
export async function createUser(data: UserInput) {
  if (!data.password) {
    throw new Error('Password harus diisi')
  }
  validatePassword(data.password)

  const existing = await prisma.user.findUnique({
    where: { username: data.username },
  })

  if (existing) {
    throw new Error('Username sudah digunakan')
  }

  const passwordHash = await bcrypt.hash(data.password, 12)

  const user = await prisma.user.create({
    data: {
      username: data.username,
      passwordHash,
      fullName: data.fullName,
      email: data.email,
      roleId: data.roleId,
      isActive: data.isActive ?? true,
    },
  })

  return user.id
}

/**
 * Update user
 */
export async function updateUser(id: string, data: UserInput) {
  const existing = await prisma.user.findUnique({
    where: { id },
  })

  if (!existing) {
    throw new Error('User tidak ditemukan')
  }

  // Check username uniqueness
  if (data.username !== existing.username) {
    const duplicate = await prisma.user.findUnique({
      where: { username: data.username },
    })
    if (duplicate) {
      throw new Error('Username sudah digunakan')
    }
  }

  const updateData: Prisma.UserUncheckedUpdateInput = {
    username: data.username,
    fullName: data.fullName,
    email: data.email,
    roleId: data.roleId,
    isActive: data.isActive ?? true,
  }

  // Only update password if provided
  if (data.password) {
    validatePassword(data.password)
    updateData.passwordHash = await bcrypt.hash(data.password, 12)
  }

  await prisma.user.update({
    where: { id },
    data: updateData,
  })
}

/**
 * Delete user
 */
export async function deleteUser(id: string) {
  const user = await prisma.user.findUnique({
    where: { id },
    include: { role: true },
  })

  if (!user) {
    throw new Error('User tidak ditemukan')
  }

  if (user.role.isSystem && user.username === 'admin') {
    throw new Error('Tidak dapat menghapus user admin utama')
  }

  await prisma.user.delete({
    where: { id },
  })
}

/**
 * Reset password
 */
export async function resetPassword(id: string, newPassword: string) {
  validatePassword(newPassword)

  const user = await prisma.user.findUnique({
    where: { id },
  })

  if (!user) {
    throw new Error('User tidak ditemukan')
  }

  const passwordHash = await bcrypt.hash(newPassword, 12)

  await prisma.user.update({
    where: { id },
    data: { passwordHash },
  })
}

/**
 * Change own password
 */
export async function changePassword(id: string, currentPassword: string, newPassword: string) {
  const user = await prisma.user.findUnique({
    where: { id },
  })

  if (!user) {
    throw new Error('User tidak ditemukan')
  }

  const isValid = await bcrypt.compare(currentPassword, user.passwordHash)
  if (!isValid) {
    throw new Error('Password lama salah')
  }

  validatePassword(newPassword)
  const passwordHash = await bcrypt.hash(newPassword, 12)

  await prisma.user.update({
    where: { id },
    data: { passwordHash },
  })
}

/**
 * Get all roles (for dropdowns)
 */
export async function getRoles() {
  return prisma.role.findMany({
    orderBy: { name: 'asc' },
    select: {
      id: true,
      name: true,
      description: true,
      isSystem: true,
      permissions: true,
      _count: {
        select: { users: true },
      },
    },
  })
}

/**
 * Get role by ID
 */
export async function getRoleById(id: string) {
  return prisma.role.findUnique({
    where: { id },
    include: {
      _count: {
        select: { users: true },
      },
    },
  })
}

/**
 * Create role
 */
export async function createRole(data: {
  name: string
  description?: string
  permissions: Record<string, boolean>
}) {
  const existing = await prisma.role.findUnique({
    where: { name: data.name },
  })

  if (existing) {
    throw new Error('Nama role sudah digunakan')
  }

  const role = await prisma.role.create({
    data: {
      name: data.name,
      description: data.description,
      permissions: data.permissions,
    },
  })

  return role.id
}

/**
 * Update role
 */
export async function updateRole(
  id: string,
  data: { name: string; description?: string; permissions: Record<string, boolean> }
) {
  const existing = await prisma.role.findUnique({
    where: { id },
  })

  if (!existing) {
    throw new Error('Role tidak ditemukan')
  }

  // Check name uniqueness
  if (data.name !== existing.name) {
    const duplicate = await prisma.role.findUnique({
      where: { name: data.name },
    })
    if (duplicate) {
      throw new Error('Nama role sudah digunakan')
    }
  }

  await prisma.role.update({
    where: { id },
    data: {
      name: existing.isSystem ? existing.name : data.name,
      description: data.description,
      permissions: data.permissions,
    },
  })
}

/**
 * Delete role
 */
export async function deleteRole(id: string) {
  const role = await prisma.role.findUnique({
    where: { id },
    include: {
      _count: {
        select: { users: true },
      },
    },
  })

  if (!role) {
    throw new Error('Role tidak ditemukan')
  }

  if (role.isSystem) {
    throw new Error('Tidak dapat menghapus role sistem')
  }

  if (role._count.users > 0) {
    throw new Error('Tidak dapat menghapus role yang masih memiliki user')
  }

  await prisma.role.delete({
    where: { id },
  })
}
