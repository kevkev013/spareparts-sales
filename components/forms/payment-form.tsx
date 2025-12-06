'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter, useSearchParams } from 'next/navigation'
import { z } from 'zod'
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
import { formatCurrency } from '@/lib/utils'

const paymentSchema = z.object({
    paymentNumber: z.string().optional(),
    paymentDate: z.date(),
    invoiceId: z.string().min(1, 'Invoice is required'),
    amount: z.number().min(1, 'Amount must be greater than 0'),
    paymentMethod: z.enum(['cash', 'transfer', 'check', 'giro', 'credit_card', 'other']),
    referenceNumber: z.string().optional(),
    notes: z.string().optional(),
})

type PaymentFormData = z.infer<typeof paymentSchema>

export function PaymentForm() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const invoiceId = searchParams.get('invoiceId')

    const [loading, setLoading] = useState(false)
    const [paymentNumber, setPaymentNumber] = useState('')
    const [invoiceDetails, setInvoiceDetails] = useState<any>(null)
    const [invoices, setInvoices] = useState<any[]>([])

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        formState: { errors },
    } = useForm<PaymentFormData>({
        resolver: zodResolver(paymentSchema),
        defaultValues: {
            paymentDate: new Date(),
            invoiceId: invoiceId || '',
            paymentMethod: 'transfer',
        },
    })

    const paymentDate = watch('paymentDate')
    const selectedInvoiceId = watch('invoiceId')

    // Fetch unpaid invoices if no invoiceId provided
    useEffect(() => {
        if (!invoiceId) {
            fetch('/api/invoices?status=unpaid&limit=100')
                .then((res) => res.json())
                .then((data) => {
                    if (data.invoices) {
                        setInvoices(data.invoices)
                    }
                })
        }
    }, [invoiceId])

    // Fetch invoice details when selected
    useEffect(() => {
        if (selectedInvoiceId) {
            fetch(`/api/invoices/${selectedInvoiceId}`)
                .then((res) => res.json())
                .then((data) => {
                    setInvoiceDetails(data)
                    // Default amount to remaining amount
                    if (data.remainingAmount) {
                        setValue('amount', Number(data.remainingAmount))
                    }
                })
        }
    }, [selectedInvoiceId, setValue])

    // Generate Payment number
    useEffect(() => {
        if (paymentDate) {
            const dateObj = paymentDate instanceof Date ? paymentDate : new Date(paymentDate)
            fetch('/api/payments/generate-number', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ paymentDate: dateObj.toISOString() }),
            })
                .then((res) => res.json())
                .then((data) => {
                    setPaymentNumber(data.paymentNumber)
                    setValue('paymentNumber', data.paymentNumber)
                })
        }
    }, [paymentDate, setValue])

    const onSubmit = async (data: PaymentFormData) => {
        try {
            setLoading(true)

            const response = await fetch('/api/payments', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.error || 'Failed to create payment')
            }

            alert('Pembayaran berhasil dicatat')
            router.push('/payments')
            router.refresh()
        } catch (error: any) {
            alert(error.message || 'Gagal mencatat pembayaran')
        } finally {
            setLoading(false)
        }
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Informasi Pembayaran</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <Label htmlFor="paymentNumber">Nomor Pembayaran</Label>
                        <Input
                            id="paymentNumber"
                            {...register('paymentNumber')}
                            disabled
                            placeholder={paymentNumber}
                            className="font-mono"
                        />
                        <p className="text-xs text-gray-600 mt-1">Auto-generate</p>
                    </div>

                    <div>
                        <Label htmlFor="paymentDate">Tanggal Pembayaran *</Label>
                        <Input
                            id="paymentDate"
                            type="date"
                            {...register('paymentDate', { valueAsDate: true })}
                        />
                        {errors.paymentDate && (
                            <p className="text-sm text-red-600 mt-1">{errors.paymentDate.message}</p>
                        )}
                    </div>

                    <div className="md:col-span-2">
                        <Label htmlFor="invoiceId">Invoice *</Label>
                        {invoiceId ? (
                            <Input
                                value={invoiceDetails ? `${invoiceDetails.invNumber} - ${invoiceDetails.customer.customerName}` : 'Loading...'}
                                disabled
                            />
                        ) : (
                            <Select
                                value={watch('invoiceId')}
                                onValueChange={(value) => setValue('invoiceId', value)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Pilih invoice" />
                                </SelectTrigger>
                                <SelectContent>
                                    {invoices.map((inv) => (
                                        <SelectItem key={inv.id} value={inv.id}>
                                            {inv.invNumber} - {inv.customer.customerName} ({formatCurrency(Number(inv.remainingAmount))})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}
                        {errors.invoiceId && (
                            <p className="text-sm text-red-600 mt-1">{errors.invoiceId.message}</p>
                        )}
                    </div>

                    {invoiceDetails && (
                        <div className="md:col-span-2 bg-gray-50 p-4 rounded-md mb-4">
                            <div className="grid grid-cols-3 gap-4 text-sm">
                                <div>
                                    <p className="text-gray-500">Total Tagihan</p>
                                    <p className="font-medium">{formatCurrency(Number(invoiceDetails.grandTotal))}</p>
                                </div>
                                <div>
                                    <p className="text-gray-500">Sudah Dibayar</p>
                                    <p className="font-medium text-green-600">
                                        {formatCurrency(Number(invoiceDetails.paidAmount))}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-gray-500">Sisa Tagihan</p>
                                    <p className="font-medium text-red-600">
                                        {formatCurrency(Number(invoiceDetails.remainingAmount))}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    <div>
                        <Label htmlFor="paymentMethod">Metode Pembayaran *</Label>
                        <Select
                            value={watch('paymentMethod')}
                            onValueChange={(value: any) => setValue('paymentMethod', value)}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Pilih metode" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="cash">Cash</SelectItem>
                                <SelectItem value="transfer">Transfer Bank</SelectItem>
                                <SelectItem value="check">Cek</SelectItem>
                                <SelectItem value="giro">Giro</SelectItem>
                                <SelectItem value="credit_card">Kartu Kredit</SelectItem>
                                <SelectItem value="other">Lainnya</SelectItem>
                            </SelectContent>
                        </Select>
                        {errors.paymentMethod && (
                            <p className="text-sm text-red-600 mt-1">{errors.paymentMethod.message}</p>
                        )}
                    </div>

                    <div>
                        <Label htmlFor="amount">Jumlah Bayar *</Label>
                        <Input
                            id="amount"
                            type="number"
                            step="0.01"
                            {...register('amount', { valueAsNumber: true })}
                        />
                        {errors.amount && <p className="text-sm text-red-600 mt-1">{errors.amount.message}</p>}
                    </div>

                    <div>
                        <Label htmlFor="referenceNumber">Nomor Referensi</Label>
                        <Input
                            id="referenceNumber"
                            {...register('referenceNumber')}
                            placeholder="Contoh: No. Bukti Transfer"
                        />
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
                    {loading ? 'Memproses...' : 'Simpan Pembayaran'}
                </Button>
            </div>
        </form>
    )
}
