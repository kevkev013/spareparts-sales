'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter, useSearchParams } from 'next/navigation'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const shipmentSchema = z.object({
    sjNumber: z.string().optional(),
    sjDate: z.date(),
    doId: z.string().min(1, 'Delivery Order is required'),
    driverName: z.string().optional(),
    vehicleNumber: z.string().optional(),
    deliveryAddress: z.string().min(1, 'Alamat pengiriman wajib diisi'),
    recipient: z.string().optional(),
    notes: z.string().optional(),
})

type ShipmentFormData = z.infer<typeof shipmentSchema>

export function ShipmentForm() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const doId = searchParams.get('doId')

    const [loading, setLoading] = useState(false)
    const [sjNumber, setSjNumber] = useState('')
    const [doDetails, setDoDetails] = useState<any>(null)

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        formState: { errors },
    } = useForm<ShipmentFormData>({
        resolver: zodResolver(shipmentSchema),
        defaultValues: {
            sjDate: new Date(),
            doId: doId || '',
        },
    })

    const sjDate = watch('sjDate')

    useEffect(() => {
        if (doId) {
            // Fetch DO details
            fetch(`/api/delivery-orders/${doId}`)
                .then((res) => res.json())
                .then((data) => {
                    setDoDetails(data)
                    // Auto-fill address from DO/Customer
                    if (data.salesOrder?.deliveryAddress) {
                        setValue('deliveryAddress', data.salesOrder.deliveryAddress)
                    } else if (data.customer?.address) {
                        setValue('deliveryAddress', data.customer.address)
                    }
                })
        }
    }, [doId, setValue])

    // Generate SJ number
    useEffect(() => {
        if (sjDate) {
            const dateObj = sjDate instanceof Date ? sjDate : new Date(sjDate)
            fetch('/api/shipments/generate-number', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sjDate: dateObj.toISOString() }),
            })
                .then((res) => res.json())
                .then((data) => {
                    setSjNumber(data.sjNumber)
                    setValue('sjNumber', data.sjNumber)
                })
        }
    }, [sjDate, setValue])

    const onSubmit = async (data: ShipmentFormData) => {
        try {
            setLoading(true)

            const response = await fetch('/api/shipments', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.error || 'Failed to create shipment')
            }

            const result = await response.json()
            alert('Shipment berhasil dibuat')
            router.push(`/sales/shipments/${result.id}`)
            router.refresh()
        } catch (error: any) {
            alert(error.message || 'Gagal membuat shipment')
        } finally {
            setLoading(false)
        }
    }

    if (!doId) {
        return (
            <div className="text-center py-8">
                <p className="text-red-600">Error: DO ID tidak ditemukan</p>
                <Button onClick={() => router.back()} className="mt-4">
                    Kembali
                </Button>
            </div>
        )
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Informasi Pengiriman</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <Label htmlFor="sjNumber">Nomor Surat Jalan</Label>
                        <Input
                            id="sjNumber"
                            {...register('sjNumber')}
                            disabled
                            placeholder={sjNumber}
                            className="font-mono"
                        />
                        <p className="text-xs text-gray-600 mt-1">Auto-generate</p>
                    </div>

                    <div>
                        <Label htmlFor="sjDate">Tanggal Pengiriman *</Label>
                        <Input id="sjDate" type="date" {...register('sjDate', { valueAsDate: true })} />
                        {errors.sjDate && <p className="text-sm text-red-600 mt-1">{errors.sjDate.message}</p>}
                    </div>

                    <div>
                        <Label>Referensi DO</Label>
                        <Input value={doDetails?.doNumber || 'Loading...'} disabled className="font-mono" />
                    </div>

                    <div>
                        <Label>Customer</Label>
                        <Input value={doDetails?.customer?.customerName || 'Loading...'} disabled />
                    </div>

                    <div>
                        <Label htmlFor="driverName">Nama Supir</Label>
                        <Input id="driverName" {...register('driverName')} placeholder="Nama supir..." />
                    </div>

                    <div>
                        <Label htmlFor="vehicleNumber">Nomor Kendaraan</Label>
                        <Input
                            id="vehicleNumber"
                            {...register('vehicleNumber')}
                            placeholder="B 1234 ABC"
                            className="uppercase"
                        />
                    </div>

                    <div className="md:col-span-2">
                        <Label htmlFor="deliveryAddress">Alamat Pengiriman *</Label>
                        <textarea
                            id="deliveryAddress"
                            {...register('deliveryAddress')}
                            className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            placeholder="Alamat tujuan..."
                        />
                        {errors.deliveryAddress && (
                            <p className="text-sm text-red-600 mt-1">{errors.deliveryAddress.message}</p>
                        )}
                    </div>

                    <div className="md:col-span-2">
                        <Label htmlFor="notes">Catatan</Label>
                        <textarea
                            id="notes"
                            {...register('notes')}
                            className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            placeholder="Catatan tambahan..."
                        />
                    </div>
                </CardContent>
            </Card>

            <div className="flex justify-end gap-4">
                <Button type="button" variant="outline" onClick={() => router.back()} disabled={loading}>
                    Batal
                </Button>
                <Button type="submit" disabled={loading}>
                    {loading ? 'Memproses...' : 'Buat Surat Jalan'}
                </Button>
            </div>
        </form>
    )
}
