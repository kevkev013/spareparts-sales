'use client'

import { useState, useEffect } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
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
import { itemSchema, type ItemFormData } from '@/validations/item'
import { ITEM_CATEGORIES, MOTOR_BRANDS, COMMON_UNITS } from '@/lib/constants'
import { Plus, Trash2 } from 'lucide-react'
import type { ItemWithRelations } from '@/types/item'

interface ItemFormProps {
  item?: ItemWithRelations
  mode: 'create' | 'edit'
}

export function ItemForm({ item, mode }: ItemFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [itemCode, setItemCode] = useState('')

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ItemFormData>({
    resolver: zodResolver(itemSchema),
    defaultValues: item
      ? {
          itemCode: item.itemCode,
          itemName: item.itemName,
          category: item.category,
          brand: item.brand,
          baseUnit: item.baseUnit,
          basePrice: Number(item.basePrice),
          sellingPrice: Number(item.sellingPrice),
          minStock: item.minStock,
          description: item.description || '',
          compatibleMotors: (item.compatibleMotors as string[]) || [],
          isTaxable: item.isTaxable,
          isActive: item.isActive,
          unitConversions: item.unitConversions?.map((uc) => ({
            fromUnit: uc.fromUnit,
            toUnit: uc.toUnit,
            conversionFactor: Number(uc.conversionFactor),
            isActive: uc.isActive,
          })) || [],
          unitPrices: item.unitPrices?.map((up) => ({
            unit: up.unit,
            buyingPrice: Number(up.buyingPrice),
            sellingPrice: Number(up.sellingPrice),
            minQty: up.minQty,
            isActive: up.isActive,
          })) || [],
        }
      : {
          isTaxable: true,
          isActive: true,
          minStock: 0,
          unitConversions: [],
          unitPrices: [],
        },
  })

  const {
    fields: unitConversionFields,
    append: appendUnitConversion,
    remove: removeUnitConversion,
  } = useFieldArray({
    control,
    name: 'unitConversions',
  })

  const {
    fields: unitPriceFields,
    append: appendUnitPrice,
    remove: removeUnitPrice,
  } = useFieldArray({
    control,
    name: 'unitPrices',
  })

  // Generate item code for create mode
  useEffect(() => {
    if (mode === 'create') {
      fetch('/api/items/generate-code')
        .then((res) => res.json())
        .then((data) => {
          setItemCode(data.itemCode)
          setValue('itemCode', data.itemCode)
        })
    }
  }, [mode, setValue])

  const onSubmit = async (data: ItemFormData) => {
    try {
      setLoading(true)

      const url = mode === 'create' ? '/api/items' : `/api/items/${item?.id}`
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
        throw new Error(error.error || 'Failed to save item')
      }

      alert(`Item berhasil ${mode === 'create' ? 'ditambahkan' : 'diupdate'}`)
      router.push('/master/items')
      router.refresh()
    } catch (error: any) {
      alert(error.message || 'Gagal menyimpan item')
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
            <Label htmlFor="itemCode">Kode Item</Label>
            <Input
              id="itemCode"
              {...register('itemCode')}
              disabled={mode === 'edit'}
              placeholder={itemCode}
            />
            {errors.itemCode && (
              <p className="text-sm text-red-600 mt-1">{errors.itemCode.message}</p>
            )}
          </div>

          <div className="md:col-span-2">
            <Label htmlFor="itemName">Nama Item *</Label>
            <Input id="itemName" {...register('itemName')} />
            {errors.itemName && (
              <p className="text-sm text-red-600 mt-1">{errors.itemName.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="category">Kategori *</Label>
            <Input
              id="category"
              {...register('category')}
              list="categories"
              placeholder="Pilih atau ketik kategori"
            />
            <datalist id="categories">
              {ITEM_CATEGORIES.map((cat) => (
                <option key={cat} value={cat} />
              ))}
            </datalist>
            {errors.category && (
              <p className="text-sm text-red-600 mt-1">{errors.category.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="brand">Merk *</Label>
            <Input
              id="brand"
              {...register('brand')}
              list="brands"
              placeholder="Pilih atau ketik merk"
            />
            <datalist id="brands">
              {MOTOR_BRANDS.map((brand) => (
                <option key={brand} value={brand} />
              ))}
            </datalist>
            {errors.brand && (
              <p className="text-sm text-red-600 mt-1">{errors.brand.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="baseUnit">Satuan Dasar *</Label>
            <Input
              id="baseUnit"
              {...register('baseUnit')}
              list="units"
              placeholder="pcs, liter, dll"
            />
            <datalist id="units">
              {COMMON_UNITS.map((unit) => (
                <option key={unit} value={unit} />
              ))}
            </datalist>
            {errors.baseUnit && (
              <p className="text-sm text-red-600 mt-1">{errors.baseUnit.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="basePrice">Harga Dasar *</Label>
            <Input
              id="basePrice"
              type="number"
              step="0.01"
              {...register('basePrice', { valueAsNumber: true })}
            />
            {errors.basePrice && (
              <p className="text-sm text-red-600 mt-1">{errors.basePrice.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="sellingPrice">Harga Jual *</Label>
            <Input
              id="sellingPrice"
              type="number"
              step="0.01"
              {...register('sellingPrice', { valueAsNumber: true })}
            />
            {errors.sellingPrice && (
              <p className="text-sm text-red-600 mt-1">{errors.sellingPrice.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="minStock">Stok Minimum</Label>
            <Input
              id="minStock"
              type="number"
              {...register('minStock', { valueAsNumber: true })}
            />
            {errors.minStock && (
              <p className="text-sm text-red-600 mt-1">{errors.minStock.message}</p>
            )}
          </div>

          <div className="md:col-span-2">
            <Label htmlFor="description">Deskripsi</Label>
            <textarea
              id="description"
              {...register('description')}
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="isTaxable"
              checked={watch('isTaxable')}
              onCheckedChange={(checked) => setValue('isTaxable', checked as boolean)}
            />
            <Label htmlFor="isTaxable" className="font-normal">
              Kena pajak
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

      {/* Unit Conversions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Konversi Satuan (Opsional)</CardTitle>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                appendUnitConversion({
                  fromUnit: '',
                  toUnit: watch('baseUnit') || '',
                  conversionFactor: 1,
                  isActive: true,
                })
              }
            >
              <Plus className="h-4 w-4 mr-2" />
              Tambah
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {unitConversionFields.map((field, index) => (
            <div key={field.id} className="flex gap-4 items-start">
              <div className="flex-1 grid grid-cols-3 gap-4">
                <div>
                  <Label>Dari Satuan</Label>
                  <Input {...register(`unitConversions.${index}.fromUnit`)} />
                </div>
                <div>
                  <Label>Ke Satuan</Label>
                  <Input {...register(`unitConversions.${index}.toUnit`)} />
                </div>
                <div>
                  <Label>Faktor</Label>
                  <Input
                    type="number"
                    step="0.0001"
                    {...register(`unitConversions.${index}.conversionFactor`, {
                      valueAsNumber: true,
                    })}
                  />
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="mt-6"
                onClick={() => removeUnitConversion(index)}
              >
                <Trash2 className="h-4 w-4 text-red-600" />
              </Button>
            </div>
          ))}
          {unitConversionFields.length === 0 && (
            <p className="text-sm text-gray-500 text-center py-4">
              Belum ada konversi satuan
            </p>
          )}
        </CardContent>
      </Card>

      {/* Unit Prices */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Harga per Satuan (Opsional)</CardTitle>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                appendUnitPrice({
                  unit: '',
                  buyingPrice: 0,
                  sellingPrice: 0,
                  minQty: 1,
                  isActive: true,
                })
              }
            >
              <Plus className="h-4 w-4 mr-2" />
              Tambah
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {unitPriceFields.map((field, index) => (
            <div key={field.id} className="flex gap-4 items-start">
              <div className="flex-1 grid grid-cols-4 gap-4">
                <div>
                  <Label>Satuan</Label>
                  <Input {...register(`unitPrices.${index}.unit`)} />
                </div>
                <div>
                  <Label>Harga Beli</Label>
                  <Input
                    type="number"
                    step="0.01"
                    {...register(`unitPrices.${index}.buyingPrice`, {
                      valueAsNumber: true,
                    })}
                  />
                </div>
                <div>
                  <Label>Harga Jual</Label>
                  <Input
                    type="number"
                    step="0.01"
                    {...register(`unitPrices.${index}.sellingPrice`, {
                      valueAsNumber: true,
                    })}
                  />
                </div>
                <div>
                  <Label>Min Qty</Label>
                  <Input
                    type="number"
                    {...register(`unitPrices.${index}.minQty`, {
                      valueAsNumber: true,
                    })}
                  />
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="mt-6"
                onClick={() => removeUnitPrice(index)}
              >
                <Trash2 className="h-4 w-4 text-red-600" />
              </Button>
            </div>
          ))}
          {unitPriceFields.length === 0 && (
            <p className="text-sm text-gray-500 text-center py-4">
              Belum ada harga per satuan
            </p>
          )}
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
          {loading ? 'Menyimpan...' : mode === 'create' ? 'Tambah Item' : 'Update Item'}
        </Button>
      </div>
    </form>
  )
}
