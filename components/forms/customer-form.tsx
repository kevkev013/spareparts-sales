'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { customerSchema, type CustomerFormData } from '@/validations/customer'
import { CUSTOMER_TYPES } from '@/lib/constants'
import type { Customer } from '@/types/customer'
import { CustomerType } from '@prisma/client'

interface CustomerFormProps {
  customer?: Customer
  mode: 'create' | 'edit'
}

export function CustomerForm({ customer, mode }: CustomerFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [customerCode, setCustomerCode] = useState('')

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CustomerFormData>({
    resolver: zodResolver(customerSchema),
    defaultValues: customer
      ? {
          customerCode: customer.customerCode,
          customerName: customer.customerName,
          customerType: customer.customerType,
          phone: customer.phone || '',
          email: customer.email || '',
          address: customer.address || '',
          city: customer.city || '',
          npwp: customer.npwp || '',
          discountRate: Number(customer.discountRate),
          creditLimit: Number(customer.creditLimit),
          creditTerm: customer.creditTerm,
          isTaxable: customer.isTaxable,
          isActive: customer.isActive,
        }
      : {
          customerType: CustomerType.retail,
          discountRate: 0,
          creditLimit: 0,
          creditTerm: 0,
          isTaxable: true,
          isActive: true,
        },
  })

  // Generate customer code for create mode
  useEffect(() => {
    if (mode === 'create') {
      fetch('/api/customers/generate-code')
        .then((res) => res.json())
        .then((data) => {
          setCustomerCode(data.customerCode)
          setValue('customerCode', data.customerCode)
        })
    }
  }, [mode, setValue])

  const onSubmit = async (data: CustomerFormData) => {
    try {
      setLoading(true)

      const url = mode === 'create' ? '/api/customers' : `/api/customers/${customer?.id}`
      const method = mode === 'create' ? 'POST' : 'PUT'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to save customer')
      }

      alert(`Customer berhasil ${mode === 'create' ? 'ditambahkan' : 'diupdate'}`)
      router.push('/master/customers')
      router.refresh()
    } catch (error: any) {
      alert(error.message || 'Gagal menyimpan customer')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle>Informasi Dasar</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="customerCode">Kode Customer</Label>
            <Input
              id="customerCode"
              {...register('customerCode')}
              disabled={mode === 'edit'}
              placeholder={customerCode}
            />
            {errors.customerCode && (
              <p className="text-sm text-red-600 mt-1">{errors.customerCode.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="customerType">Tipe Customer *</Label>
            <Select
              value={watch('customerType')}
              onValueChange={(value) => setValue('customerType', value as CustomerType)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih tipe" />
              </SelectTrigger>
              <SelectContent>
                {CUSTOMER_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.customerType && (
              <p className="text-sm text-red-600 mt-1">{errors.customerType.message}</p>
            )}
          </div>

          <div className="md:col-span-2">
            <Label htmlFor="customerName">Nama Customer *</Label>
            <Input id="customerName" {...register('customerName')} />
            {errors.customerName && (
              <p className="text-sm text-red-600 mt-1">{errors.customerName.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="phone">Telepon</Label>
            <Input id="phone" {...register('phone')} placeholder="08xxxxxxxxxx" />
            {errors.phone && (
              <p className="text-sm text-red-600 mt-1">{errors.phone.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" {...register('email')} placeholder="email@example.com" />
            {errors.email && (
              <p className="text-sm text-red-600 mt-1">{errors.email.message}</p>
            )}
          </div>

          <div className="md:col-span-2">
            <Label htmlFor="address">Alamat</Label>
            <textarea
              id="address"
              {...register('address')}
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>

          <div>
            <Label htmlFor="city">Kota</Label>
            <Input id="city" {...register('city')} />
            {errors.city && (
              <p className="text-sm text-red-600 mt-1">{errors.city.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="npwp">NPWP</Label>
            <Input id="npwp" {...register('npwp')} placeholder="xx.xxx.xxx.x-xxx.xxx" />
            {errors.npwp && (
              <p className="text-sm text-red-600 mt-1">{errors.npwp.message}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Credit & Discount */}
      <Card>
        <CardHeader>
          <CardTitle>Kredit & Diskon</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="creditLimit">Credit Limit (Rp)</Label>
            <Input
              id="creditLimit"
              type="number"
              step="1"
              {...register('creditLimit', { valueAsNumber: true })}
            />
            {errors.creditLimit && (
              <p className="text-sm text-red-600 mt-1">{errors.creditLimit.message}</p>
            )}
            <p className="text-xs text-gray-600 mt-1">Maksimal piutang yang diperbolehkan</p>
          </div>

          <div>
            <Label htmlFor="creditTerm">Credit Term (Hari)</Label>
            <Input
              id="creditTerm"
              type="number"
              {...register('creditTerm', { valueAsNumber: true })}
            />
            {errors.creditTerm && (
              <p className="text-sm text-red-600 mt-1">{errors.creditTerm.message}</p>
            )}
            <p className="text-xs text-gray-600 mt-1">Jatuh tempo pembayaran (0 = cash)</p>
          </div>

          <div>
            <Label htmlFor="discountRate">Diskon Default (%)</Label>
            <Input
              id="discountRate"
              type="number"
              step="0.01"
              {...register('discountRate', { valueAsNumber: true })}
            />
            {errors.discountRate && (
              <p className="text-sm text-red-600 mt-1">{errors.discountRate.message}</p>
            )}
            <p className="text-xs text-gray-600 mt-1">Diskon otomatis untuk customer ini</p>
          </div>
        </CardContent>
      </Card>

      {/* Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Pengaturan</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="isTaxable"
              checked={watch('isTaxable')}
              onCheckedChange={(checked) => setValue('isTaxable', checked as boolean)}
            />
            <Label htmlFor="isTaxable" className="font-normal">
              Kena pajak (PPN)
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="isActive"
              checked={watch('isActive')}
              onCheckedChange={(checked) => setValue('isActive', checked as boolean)}
            />
            <Label htmlFor="isActive" className="font-normal">
              Aktif
            </Label>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={loading}
        >
          Batal
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Menyimpan...' : mode === 'create' ? 'Tambah Customer' : 'Update Customer'}
        </Button>
      </div>
    </form>
  )
}
