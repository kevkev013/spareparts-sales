'use client'

import { useState, useEffect } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { Plus, Trash2 } from 'lucide-react'
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
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import {
    salesOrderSchema,
    type SalesOrderFormData,
} from '@/validations/sales-order'
import { ORDER_STATUS } from '@/lib/constants'
import { formatCurrency } from '@/lib/utils'
import type { SalesOrderWithRelations } from '@/types/sales-order'

interface SalesOrderFormProps {
    order?: SalesOrderWithRelations
    mode: 'create' | 'edit'
}

interface ItemOption {
    itemCode: string
    itemName: string
    baseUnit: string
    sellingPrice: number
    units: string[]
}

interface CustomerOption {
    customerCode: string
    customerName: string
    discountRate: number
    address: string
}

export function SalesOrderForm({ order, mode }: SalesOrderFormProps) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [soNumber, setSoNumber] = useState('')
    const [items, setItems] = useState<ItemOption[]>([])
    const [customers, setCustomers] = useState<CustomerOption[]>([])

    const {
        register,
        handleSubmit,
        watch,
        setValue,
        control,
        formState: { errors },
    } = useForm<SalesOrderFormData>({
        resolver: zodResolver(salesOrderSchema),
        defaultValues: order
            ? {
                soNumber: order.soNumber,
                soDate: order.soDate,
                customerCode: order.customerCode,
                deliveryDate: order.deliveryDate || undefined,
                deliveryAddress: order.deliveryAddress || '',
                notes: order.notes || '',
                status: order.status,
                items: order.items.map((item) => ({
                    itemCode: item.itemCode,
                    quantity: Number(item.quantity),
                    unit: item.unit,
                    unitPrice: Number(item.unitPrice),
                    discountPercent: Number(item.discountPercent),
                    notes: item.notes || undefined,
                })),
            }
            : {
                soDate: new Date(),
                status: 'confirmed',
                items: [],
            },
    })

    const { fields, append, remove } = useFieldArray({
        control,
        name: 'items',
    })

    const soDate = watch('soDate')
    const selectedCustomerCode = watch('customerCode')
    const watchedItems = watch('items')

    // Fetch items
    useEffect(() => {
        fetch('/api/items?limit=100&isActive=true')
            .then((res) => res.json())
            .then((data) => {
                if (data.items) {
                    const formattedItems: ItemOption[] = data.items.map((item: any) => ({
                        itemCode: item.itemCode,
                        itemName: item.itemName,
                        baseUnit: item.baseUnit,
                        sellingPrice: Number(item.sellingPrice),
                        units: [item.baseUnit], // In a real app, you'd fetch unit conversions
                    }))
                    setItems(formattedItems)
                }
            })
    }, [])

    // Fetch customers
    useEffect(() => {
        fetch('/api/customers?limit=100&isActive=true')
            .then((res) => res.json())
            .then((data) => {
                if (data.customers) {
                    setCustomers(data.customers)
                }
            })
    }, [])

    // Generate SO number when date changes (only in create mode)
    useEffect(() => {
        if (mode === 'create' && soDate) {
            const dateObj = soDate instanceof Date ? soDate : new Date(soDate)
            fetch('/api/sales-orders/generate-number', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ soDate: dateObj.toISOString() }),
            })
                .then((res) => res.json())
                .then((data) => {
                    setSoNumber(data.soNumber)
                    setValue('soNumber', data.soNumber)
                })
        }
    }, [soDate, mode, setValue])

    // Auto-fill customer details when customer is selected
    useEffect(() => {
        if (selectedCustomerCode) {
            const customer = customers.find((c) => c.customerCode === selectedCustomerCode)
            if (customer) {
                // Auto-fill delivery address if empty
                const currentAddress = watch('deliveryAddress')
                if (!currentAddress) {
                    setValue('deliveryAddress', customer.address || '')
                }

                // Apply customer discount to all items if they don't have a discount yet
                if (fields.length > 0) {
                    fields.forEach((_, index) => {
                        const currentDiscount = watchedItems[index]?.discountPercent || 0
                        if (currentDiscount === 0) {
                            setValue(`items.${index}.discountPercent`, Number(customer.discountRate))
                        }
                    })
                }
            }
        }
    }, [selectedCustomerCode, customers, fields, setValue, watchedItems, watch])

    const handleAddItem = () => {
        const customer = customers.find((c) => c.customerCode === selectedCustomerCode)
        append({
            itemCode: '',
            quantity: 1,
            unit: '',
            unitPrice: 0,
            discountPercent: customer ? Number(customer.discountRate) : 0,
            notes: '',
        })
    }

    const handleItemChange = (index: number, itemCode: string) => {
        const item = items.find((i) => i.itemCode === itemCode)
        if (item) {
            setValue(`items.${index}.itemCode`, itemCode)
            setValue(`items.${index}.unit`, item.baseUnit)
            setValue(`items.${index}.unitPrice`, item.sellingPrice)
        }
    }

    // Calculate totals
    const calculateTotals = () => {
        let subtotal = 0

        watchedItems?.forEach((item) => {
            if (item.itemCode && item.quantity && item.unitPrice) {
                const itemTotal = item.quantity * item.unitPrice
                const discount = (itemTotal * (item.discountPercent || 0)) / 100
                subtotal += itemTotal - discount
            }
        })

        return {
            subtotal,
            grandTotal: subtotal, // Tax will be calculated in the backend
        }
    }

    const totals = calculateTotals()

    const onSubmit = async (data: SalesOrderFormData) => {
        try {
            setLoading(true)

            const url =
                mode === 'create' ? '/api/sales-orders' : `/api/sales-orders/${order?.id}`
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
                throw new Error(error.error || 'Failed to save sales order')
            }

            alert(`Sales Order berhasil ${mode === 'create' ? 'ditambahkan' : 'diupdate'}`)
            router.push('/sales/orders')
            router.refresh()
        } catch (error: any) {
            alert(error.message || 'Gagal menyimpan sales order')
        } finally {
            setLoading(false)
        }
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Header Information */}
            <Card>
                <CardHeader>
                    <CardTitle>Informasi Order</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <Label htmlFor="soNumber">Nomor SO</Label>
                        <Input
                            id="soNumber"
                            {...register('soNumber')}
                            disabled
                            placeholder={soNumber}
                            className="font-mono"
                        />
                        {errors.soNumber && (
                            <p className="text-sm text-red-600 mt-1">{errors.soNumber.message}</p>
                        )}
                        <p className="text-xs text-gray-600 mt-1">Auto-generate berdasarkan tanggal</p>
                    </div>

                    <div>
                        <Label htmlFor="soDate">Tanggal Order *</Label>
                        <Input id="soDate" type="date" {...register('soDate', { valueAsDate: true })} />
                        {errors.soDate && <p className="text-sm text-red-600 mt-1">{errors.soDate.message}</p>}
                    </div>

                    <div>
                        <Label htmlFor="customerCode">Customer *</Label>
                        <Select
                            value={watch('customerCode') || ''}
                            onValueChange={(value) => setValue('customerCode', value)}
                            disabled={mode === 'edit'}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Pilih customer" />
                            </SelectTrigger>
                            <SelectContent>
                                {customers.map((customer) => (
                                    <SelectItem key={customer.customerCode} value={customer.customerCode}>
                                        {customer.customerCode} - {customer.customerName}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {errors.customerCode && (
                            <p className="text-sm text-red-600 mt-1">{errors.customerCode.message}</p>
                        )}
                    </div>

                    <div>
                        <Label htmlFor="deliveryDate">Tanggal Pengiriman</Label>
                        <Input id="deliveryDate" type="date" {...register('deliveryDate', { valueAsDate: true })} />
                        {errors.deliveryDate && (
                            <p className="text-sm text-red-600 mt-1">{errors.deliveryDate.message}</p>
                        )}
                    </div>

                    <div className="md:col-span-2">
                        <Label htmlFor="deliveryAddress">Alamat Pengiriman</Label>
                        <textarea
                            id="deliveryAddress"
                            {...register('deliveryAddress')}
                            className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            placeholder="Alamat pengiriman barang..."
                        />
                        {errors.deliveryAddress && (
                            <p className="text-sm text-red-600 mt-1">{errors.deliveryAddress.message}</p>
                        )}
                    </div>

                    <div>
                        <Label htmlFor="status">Status *</Label>
                        <Select
                            value={watch('status') || 'confirmed'}
                            onValueChange={(value: any) => setValue('status', value)}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Pilih status" />
                            </SelectTrigger>
                            <SelectContent>
                                {ORDER_STATUS.map((status) => (
                                    <SelectItem key={status.value} value={status.value}>
                                        {status.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {errors.status && <p className="text-sm text-red-600 mt-1">{errors.status.message}</p>}
                    </div>

                    <div className="md:col-span-2">
                        <Label htmlFor="notes">Catatan</Label>
                        <textarea
                            id="notes"
                            {...register('notes')}
                            className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            placeholder="Catatan tambahan untuk order ini..."
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Line Items */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle>Item Order</CardTitle>
                        <Button type="button" onClick={handleAddItem} size="sm">
                            <Plus className="h-4 w-4 mr-2" />
                            Tambah Item
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    {errors.items && !Array.isArray(errors.items) && (
                        <p className="text-sm text-red-600 mb-4">{errors.items.message}</p>
                    )}

                    {fields.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            Belum ada item. Klik &quot;Tambah Item&quot; untuk menambahkan.
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[300px]">Item</TableHead>
                                        <TableHead className="w-[100px]">Qty</TableHead>
                                        <TableHead className="w-[100px]">Unit</TableHead>
                                        <TableHead className="w-[150px]">Harga</TableHead>
                                        <TableHead className="w-[100px]">Disc %</TableHead>
                                        <TableHead className="w-[150px]">Subtotal</TableHead>
                                        <TableHead className="w-[50px]"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {fields.map((field, index) => {
                                        const item = watchedItems[index]
                                        const itemTotal = item?.quantity && item?.unitPrice
                                            ? item.quantity * item.unitPrice
                                            : 0
                                        const discount = itemTotal * ((item?.discountPercent || 0) / 100)
                                        const subtotal = itemTotal - discount

                                        return (
                                            <TableRow key={field.id}>
                                                <TableCell>
                                                    <Select
                                                        value={watch(`items.${index}.itemCode`) || ''}
                                                        onValueChange={(value) => handleItemChange(index, value)}
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
                                                    {errors.items?.[index]?.itemCode && (
                                                        <p className="text-xs text-red-600 mt-1">
                                                            {errors.items[index]?.itemCode?.message}
                                                        </p>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <Input
                                                        type="number"
                                                        step="0.01"
                                                        {...register(`items.${index}.quantity`, { valueAsNumber: true })}
                                                        className="w-full"
                                                    />
                                                    {errors.items?.[index]?.quantity && (
                                                        <p className="text-xs text-red-600 mt-1">
                                                            {errors.items[index]?.quantity?.message}
                                                        </p>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <Input {...register(`items.${index}.unit`)} className="w-full" disabled />
                                                </TableCell>
                                                <TableCell>
                                                    <Input
                                                        type="number"
                                                        step="0.01"
                                                        {...register(`items.${index}.unitPrice`, { valueAsNumber: true })}
                                                        className="w-full"
                                                    />
                                                    {errors.items?.[index]?.unitPrice && (
                                                        <p className="text-xs text-red-600 mt-1">
                                                            {errors.items[index]?.unitPrice?.message}
                                                        </p>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <Input
                                                        type="number"
                                                        step="0.01"
                                                        {...register(`items.${index}.discountPercent`, {
                                                            valueAsNumber: true,
                                                        })}
                                                        className="w-full"
                                                    />
                                                    {errors.items?.[index]?.discountPercent && (
                                                        <p className="text-xs text-red-600 mt-1">
                                                            {errors.items[index]?.discountPercent?.message}
                                                        </p>
                                                    )}
                                                </TableCell>
                                                <TableCell className="font-medium">{formatCurrency(subtotal)}</TableCell>
                                                <TableCell>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => remove(index)}
                                                    >
                                                        <Trash2 className="h-4 w-4 text-red-600" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        )
                                    })}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Totals */}
            {fields.length > 0 && (
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex flex-col items-end space-y-2">
                            <div className="flex justify-between w-64">
                                <span className="text-gray-600">Subtotal:</span>
                                <span className="font-medium">{formatCurrency(totals.subtotal)}</span>
                            </div>
                            <div className="flex justify-between w-64 text-lg font-bold border-t pt-2">
                                <span>Grand Total:</span>
                                <span>{formatCurrency(totals.grandTotal)}</span>
                            </div>
                            <p className="text-xs text-gray-600">*Pajak akan dihitung otomatis di backend</p>
                        </div>
                    </CardContent>
                </Card>
            )}

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
                <Button type="submit" disabled={loading || fields.length === 0}>
                    {loading
                        ? 'Menyimpan...'
                        : mode === 'create'
                            ? 'Buat Order'
                            : 'Update Order'}
                </Button>
            </div>
        </form>
    )
}
