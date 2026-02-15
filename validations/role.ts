import { z } from 'zod'
import { getAllPermissionKeys } from '@/lib/permissions'

const validKeys = getAllPermissionKeys()

export const roleSchema = z.object({
  name: z
    .string()
    .min(1, 'Nama role harus diisi')
    .max(50, 'Nama role maksimal 50 karakter'),
  description: z.string().max(255).optional().or(z.literal('')),
  permissions: z.record(z.string(), z.boolean()).refine(
    (perms) => {
      return Object.keys(perms).every((key) => validKeys.includes(key))
    },
    { message: 'Terdapat permission key yang tidak valid' }
  ),
})

export type RoleFormData = z.infer<typeof roleSchema>
