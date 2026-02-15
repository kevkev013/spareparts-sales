import { z } from 'zod'

const passwordSchema = z
  .string()
  .min(8, 'Password minimal 8 karakter')
  .max(72, 'Password maksimal 72 karakter')
  .regex(/[a-z]/, 'Password harus mengandung huruf kecil')
  .regex(/[A-Z]/, 'Password harus mengandung huruf besar')
  .regex(/[0-9]/, 'Password harus mengandung angka')

export const createUserSchema = z.object({
  username: z
    .string()
    .min(3, 'Username minimal 3 karakter')
    .max(50, 'Username maksimal 50 karakter')
    .regex(/^[a-zA-Z0-9._-]+$/, 'Username hanya boleh huruf, angka, titik, underscore, dan dash'),
  password: passwordSchema,
  fullName: z.string().min(1, 'Nama lengkap harus diisi').max(255),
  email: z.string().email('Format email tidak valid').max(100).optional().or(z.literal('')),
  roleId: z.string().uuid('Role ID tidak valid'),
  isActive: z.boolean().optional().default(true),
})

export const updateUserSchema = z.object({
  username: z
    .string()
    .min(3, 'Username minimal 3 karakter')
    .max(50, 'Username maksimal 50 karakter')
    .regex(/^[a-zA-Z0-9._-]+$/, 'Username hanya boleh huruf, angka, titik, underscore, dan dash'),
  password: passwordSchema.optional().or(z.literal('')),
  fullName: z.string().min(1, 'Nama lengkap harus diisi').max(255),
  email: z.string().email('Format email tidak valid').max(100).optional().or(z.literal('')),
  roleId: z.string().uuid('Role ID tidak valid'),
  isActive: z.boolean().optional().default(true),
})

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Password lama harus diisi'),
  newPassword: passwordSchema,
})

export const resetPasswordSchema = z.object({
  newPassword: passwordSchema,
})

export { passwordSchema }

export type CreateUserFormData = z.infer<typeof createUserSchema>
export type UpdateUserFormData = z.infer<typeof updateUserSchema>
