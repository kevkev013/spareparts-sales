'use client'

import { useState, useEffect } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { z } from 'zod'
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

const returnSchema = z.object({
    returnNumber: z.string().optional(),
    returnDate: z.date(),
    customerCode: z.string().min(1, 'Customer is required'),
    soId: z.string().optional(),
    reason: z.string().optional(),
    items: z.array(
        z.object({
            itemCode: z.string().min(1, 'Item is required'),
            quantity: z.number().min(0.01, 'Quantity must be greater than 0'),
            unit: z.string(),
            condition: z.string().optional(),
            notes: z.string().optional(),
        })
    ).min(1, 'At least one item is required'),
})

type ReturnFormData = z.infer<typeof returnSchema>

export function ReturnForm() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [returnNumber, setReturnNumber] = useState('')
    const [customers, setCustomers] = useState<any[]>([])
    const [items, setItems] = useState<any[]>([])

    const {
        register,
        handleSubmit,
        control,
        setValue,
        watch,
        formState: { errors },
    } = useForm<ReturnFormData>({
        resolver: zodResolver(returnSchema),
        defaultValues: {
            returnDate: new Date(),
            items: [],
        },
    })

    const { fields, append, remove } = useFieldArray({
        control,
        name: 'items',
    })

    const returnDate = watch('returnDate')
    const watchedItems = watch('items')

    // Fetch customers
    useEffect(() => {
        fetch('/api/customers?limit=100')
            .then((res) => res.json())
            .then((data) => {
                if (data.customers) setCustomers(data.customers)
            })
    }, [])

    // Fetch items
    useEffect(() => {
        fetch('/api/items?limit=100')
            .then((res) => res.json())
            .then((data) => {
                if (data.items) setItems(data.items)
            })
    }, [])

    // Generate Return number
    useEffect(() => {
        if (returnDate) {
            const dateObj = returnDate instanceof Date ? returnDate : new Date(returnDate)
            fetch('/api/returns/generate-number', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ returnDate: dateObj.toISOString() }),
            })
                .then((res) => res.json())
                .then((data) => {
                    setReturnNumber(data.returnNumber)
                    setValue('returnNumber', data.returnNumber)
                })
        }
    }, [returnDate, setValue])

    const handleAddItem = () => {
        append({
            itemCode: '',
            quantity: 1,
            unit: '',
            condition: 'good',
            notes: '',
        })
    }

    const handleItemChange = (index: number, itemCode: string) => {
        const item = items.find((i) => i.itemCode === itemCode)
        if (item) {
            setValue(`items.${index}.itemCode`, itemCode)
            setValue(`items.${index}.unit`, item.baseUnit)
        }
    }

    const onSubmit = async (data: ReturnFormData) => {
        try {
            setLoading(true)

            const response = await fetch('/api/returns', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.error || 'Failed to create return')
            }

            alert('Retur berhasil dibuat')
            router.push('/returns')
            router.refresh()
        } catch (error: any) {
            alert(error.message || 'Gagal membuat retur')
        } finally {
            setLoading(false)
        }
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Informasi Retur</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <Label htmlFor="returnNumber">Nomor Retur</Label>
                        <Input
                            id="returnNumber"
                            {...register('returnNumber')}
                            disabled
                            placeholder={returnNumber}
                            className="font-mono"
                        />
                        <p className="text-xs text-gray-600 mt-1">Auto-generate</p>
                    </div>

                    <div>
                        <Label htmlFor="returnDate">Tanggal Retur *</Label>
                        <Input
                            id="returnDate"
                            type="date"
                            {...register('returnDate', { valueAsDate: true })}
                        />
                        {errors.returnDate && (
                            <p className="text-sm text-red-600 mt-1">{errors.returnDate.message}</p>
                        )}
                    </div>

                    <div>
                        <Label htmlFor="customerCode">Customer *</Label>
                        <Select
                            value={watch('customerCode')}
                            onValueChange={(value) => setValue('customerCode', value)}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Pilih customer" />
                            </SelectTrigger>
                            <SelectContent>
                                {customers.map((c) => (
                                    <SelectItem key={c.customerCode} value={c.customerCode}>
                                        {c.customerCode} - {c.customerName}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {errors.customerCode && (
                            <p className="text-sm text-red-600 mt-1">{errors.customerCode.message}</p>
                        )}
                    </div>

                    <div className="md:col-span-2">
                        <Label htmlFor="reason">Alasan Retur</Label>
                        <textarea
                            id="reason"
                            {...register('reason')}
                            className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            placeholder="Alasan pengembalian barang..."
                        />
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle>Item Retur</CardTitle>
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
                                        <TableHead className="w-[150px]">Kondisi</TableHead>
                                        <TableHead className="w-[200px]">Catatan</TableHead>
                                        <TableHead className="w-[50px]"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {fields.map((field, index) => (
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
                                                <Select
                                                    value={watch(`items.${index}.condition`) || 'good'}
                                                    onValueChange={(value) => setValue(`items.${index}.condition`, value)}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Kondisi" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="good">Baik</SelectItem>
                                                        <SelectItem value="damaged">Rusak</SelectItem>
                                                        <SelectItem value="expired">Expired</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </TableCell>
                                            <TableCell>
                                                <Input {...register(`items.${index}.notes`)} className="w-full" />
                                            </TableCell>
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
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>

            <div className="flex justify-end gap-4">
                <Button type="button" variant="outline" onClick={() => router.back()} disabled={loading}>
                    Batal
                </Button>
                <Button type="submit" disabled={loading}>
                    {loading ? 'Memproses...' : 'Simpan Retur'}
                </Button>
            </div>
        </form>
    )
}
