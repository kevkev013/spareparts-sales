'use client'

import { useState } from 'react'
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
import { locationSchema, type LocationFormData } from '@/validations/location'
import { ZONE_OPTIONS } from '@/types/location'
import type { Location } from '@/types/location'

interface LocationFormProps {
  location?: Location
  mode: 'create' | 'edit'
}

export function LocationForm({ location, mode }: LocationFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<LocationFormData>({
    resolver: zodResolver(locationSchema),
    defaultValues: location
      ? {
          locationCode: location.locationCode,
          locationName: location.locationName,
          warehouse: location.warehouse,
          zone: location.zone || '',
          description: location.description || '',
          isActive: location.isActive,
        }
      : {
          locationCode: '',
          locationName: '',
          warehouse: 'Gudang Utama',
          zone: '',
          description: '',
          isActive: true,
        },
  })

  const onSubmit = async (data: LocationFormData) => {
    try {
      setLoading(true)

      const url = mode === 'create' ? '/api/locations' : `/api/locations/${location?.id}`
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
        throw new Error(error.error || 'Failed to save location')
      }

      alert(`Lokasi berhasil ${mode === 'create' ? 'ditambahkan' : 'diupdate'}`)
      router.push('/master/locations')
      router.refresh()
    } catch (error: any) {
      alert(error.message || 'Gagal menyimpan lokasi')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle>Informasi Lokasi</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="locationCode">Kode Lokasi *</Label>
            <Input
              id="locationCode"
              {...register('locationCode')}
              placeholder="GD-A1, GD-B2, dll"
              disabled={mode === 'edit'}
              className="uppercase"
            />
            {errors.locationCode && (
              <p className="text-sm text-red-600 mt-1">{errors.locationCode.message}</p>
            )}
            <p className="text-xs text-gray-600 mt-1">
              Format: Huruf besar, angka, dan dash (contoh: GD-A1)
            </p>
          </div>

          <div>
            <Label htmlFor="warehouse">Nama Gudang *</Label>
            <Input
              id="warehouse"
              {...register('warehouse')}
              placeholder="Gudang Utama"
            />
            {errors.warehouse && (
              <p className="text-sm text-red-600 mt-1">{errors.warehouse.message}</p>
            )}
          </div>

          <div className="md:col-span-2">
            <Label htmlFor="locationName">Nama Lokasi *</Label>
            <Input
              id="locationName"
              {...register('locationName')}
              placeholder="Gudang A - Rak 1"
            />
            {errors.locationName && (
              <p className="text-sm text-red-600 mt-1">{errors.locationName.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="zone">Zona</Label>
            <Select
              value={watch('zone') || ''}
              onValueChange={(value) => setValue('zone', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih zona (opsional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Tidak ada zona</SelectItem>
                {ZONE_OPTIONS.map((zone) => (
                  <SelectItem key={zone.value} value={zone.value}>
                    {zone.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.zone && (
              <p className="text-sm text-red-600 mt-1">{errors.zone.message}</p>
            )}
          </div>

          <div className="flex items-center space-x-2 pt-6">
            <Checkbox
              id="isActive"
              checked={watch('isActive')}
              onCheckedChange={(checked) => setValue('isActive', checked as boolean)}
            />
            <Label htmlFor="isActive" className="font-normal">
              Aktif
            </Label>
          </div>

          <div className="md:col-span-2">
            <Label htmlFor="description">Deskripsi</Label>
            <textarea
              id="description"
              {...register('description')}
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="Keterangan tambahan tentang lokasi ini..."
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
          {loading ? 'Menyimpan...' : mode === 'create' ? 'Tambah Lokasi' : 'Update Lokasi'}
        </Button>
      </div>
    </form>
  )
}
