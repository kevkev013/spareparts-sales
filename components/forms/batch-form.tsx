'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { batchSchema, type BatchFormData } from '@/validations/batch'
import type { BatchWithRelations } from '@/types/batch'

interface BatchFormProps {
  batch?: BatchWithRelations
  mode: 'create' | 'edit'
}

export function BatchForm({ batch, mode }: BatchFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [batchNumber, setBatchNumber] = useState('')
  const [items, setItems] = useState<Array<{ itemCode: string; itemName: string }>>([])

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<BatchFormData>({
    resolver: zodResolver(batchSchema),
    defaultValues: batch
      ? {
          batchNumber: batch.batchNumber,
          itemCode: batch.itemCode,
          purchaseDate: batch.purchaseDate,
          purchasePrice: Number(batch.purchasePrice),
          supplier: batch.supplier,
          expiryDate: batch.expiryDate || undefined,
          notes: batch.notes || '',
        }
      : {
          purchaseDate: new Date(),
          purchasePrice: 0,
          supplier: '',
        },
  })

  const purchaseDate = watch('purchaseDate')

  // Fetch items for dropdown
  useEffect(() => {
    fetch('/api/items?limit=100&isActive=true')
      .then((res) => res.json())
      .then((data) => {
        if (data.items) {
          setItems(data.items)
        }
      })
  }, [])

  // Generate batch number when purchase date changes (only in create mode)
  useEffect(() => {
    if (mode === 'create' && purchaseDate) {
      const dateObj = purchaseDate instanceof Date ? purchaseDate : new Date(purchaseDate)
      fetch('/api/batches/generate-number', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ purchaseDate: dateObj.toISOString() }),
      })
        .then((res) => res.json())
        .then((data) => {
          setBatchNumber(data.batchNumber)
          setValue('batchNumber', data.batchNumber)
        })
    }
  }, [purchaseDate, mode, setValue])

  const onSubmit = async (data: BatchFormData) => {
    try {
      setLoading(true)

      const url = mode === 'create' ? '/api/batches' : `/api/batches/${batch?.id}`
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
        throw new Error(error.error || 'Failed to save batch')
      }

      alert(`Batch berhasil ${mode === 'create' ? 'ditambahkan' : 'diupdate'}`)
      router.push('/master/batches')
      router.refresh()
    } catch (error: any) {
      alert(error.message || 'Gagal menyimpan batch')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Informasi Batch</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="batchNumber">Nomor Batch</Label>
            <Input
              id="batchNumber"
              {...register('batchNumber')}
              disabled={mode === 'edit'}
              placeholder={batchNumber}
            />
            {errors.batchNumber && (
              <p className="text-sm text-red-600 mt-1">{errors.batchNumber.message}</p>
            )}
            <p className="text-xs text-gray-600 mt-1">
              Auto-generate berdasarkan tanggal pembelian
            </p>
          </div>

          <div>
            <Label htmlFor="itemCode">Item *</Label>
            <Select
              value={watch('itemCode') || ''}
              onValueChange={(value) => setValue('itemCode', value)}
              disabled={mode === 'edit'}
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih item" />
              </SelectTrigger>
              <SelectContent>
                {items.map((item) => (
                  <SelectItem key={item.itemCode} value={item.itemCode}>
                    {item.itemCode} - {item.itemName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.itemCode && (
              <p className="text-sm text-red-600 mt-1">{errors.itemCode.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="purchaseDate">Tanggal Pembelian *</Label>
            <Input
              id="purchaseDate"
              type="date"
              {...register('purchaseDate')}
            />
            {errors.purchaseDate && (
              <p className="text-sm text-red-600 mt-1">{errors.purchaseDate.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="purchasePrice">Harga Beli (per unit) *</Label>
            <Input
              id="purchasePrice"
              type="number"
              step="0.01"
              {...register('purchasePrice', { valueAsNumber: true })}
            />
            {errors.purchasePrice && (
              <p className="text-sm text-red-600 mt-1">{errors.purchasePrice.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="supplier">Supplier *</Label>
            <Input
              id="supplier"
              {...register('supplier')}
              placeholder="Nama supplier"
            />
            {errors.supplier && (
              <p className="text-sm text-red-600 mt-1">{errors.supplier.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="expiryDate">Tanggal Kadaluarsa (Opsional)</Label>
            <Input
              id="expiryDate"
              type="date"
              {...register('expiryDate')}
            />
            {errors.expiryDate && (
              <p className="text-sm text-red-600 mt-1">{errors.expiryDate.message}</p>
            )}
          </div>

          <div className="md:col-span-2">
            <Label htmlFor="notes">Catatan</Label>
            <textarea
              id="notes"
              {...register('notes')}
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="Catatan tambahan tentang batch ini..."
            />
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
          {loading ? 'Menyimpan...' : mode === 'create' ? 'Tambah Batch' : 'Update Batch'}
        </Button>
      </div>
    </form>
  )
}
