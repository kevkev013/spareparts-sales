import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronLeft, Printer, CreditCard } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { getInvoiceById } from '@/services/invoice.service'
import { formatCurrency, formatDate } from '@/lib/utils'
import { INVOICE_STATUS } from '@/lib/constants'

interface PageProps {
    params: {
        id: string
    }
}

export default async function InvoiceDetailPage({ params }: PageProps) {
    const invoice = await getInvoiceById(params.id)

    if (!invoice) {
        notFound()
    }

    const getStatusBadge = (status: string) => {
        const variants: Record<string, any> = {
            unpaid: 'destructive',
            partial_paid: 'secondary',
            paid: 'default',
            overdue: 'destructive',
            cancelled: 'outline',
        }
        return variants[status] || 'secondary'
    }

    const getStatusLabel = (status: string) => {
        const found = INVOICE_STATUS.find((s) => s.value === status)
        return found?.label || status
    }

    return (
        <div className="container mx-auto py-8">
            <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/sales/invoices">
                        <Button variant="ghost" size="sm">
                            <ChevronLeft className="h-4 w-4 mr-2" />
                            Kembali
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold flex items-center gap-3">
                            Invoice {invoice.invNumber}
                            <Badge variant={getStatusBadge(invoice.status)}>
                                {getStatusLabel(invoice.status)}
                            </Badge>
                        </h1>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline">
                        <Printer className="h-4 w-4 mr-2" />
                        Cetak Invoice
                    </Button>
                    {invoice.status !== 'paid' && invoice.status !== 'cancelled' && (
                        <Link href={`/payments/create?invoiceId=${invoice.id}`}>
                            <Button>
                                <CreditCard className="h-4 w-4 mr-2" />
                                Bayar
                            </Button>
                        </Link>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {/* Customer Info */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Informasi Customer</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            <div>
                                <p className="text-sm text-gray-500">Nama Customer</p>
                                <p className="font-medium">{invoice.customer.customerName}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Kode Customer</p>
                                <p className="font-mono text-sm">{invoice.customerCode}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Alamat</p>
                                <p className="text-sm">{invoice.customer.address || '-'}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Invoice Info */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Informasi Invoice</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            <div>
                                <p className="text-sm text-gray-500">Tanggal Invoice</p>
                                <p className="font-medium">{formatDate(invoice.invDate)}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Jatuh Tempo</p>
                                <p className="font-medium text-red-600">{formatDate(invoice.dueDate)}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Referensi SO</p>
                                <Link
                                    href={`/sales/orders/${invoice.soId}`}
                                    className="text-blue-600 hover:underline font-mono text-sm"
                                >
                                    {invoice.soNumber}
                                </Link>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Payment Info */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Status Pembayaran</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            <div>
                                <p className="text-sm text-gray-500">Total Tagihan</p>
                                <p className="font-bold text-lg">{formatCurrency(Number(invoice.grandTotal))}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Sudah Dibayar</p>
                                <p className="font-medium text-green-600">
                                    {formatCurrency(Number(invoice.paidAmount))}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Sisa Tagihan</p>
                                <p className="font-medium text-red-600">
                                    {formatCurrency(Number(invoice.remainingAmount))}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Items Table */}
            <Card className="mb-8">
                <CardHeader>
                    <CardTitle>Item Invoice</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Item</TableHead>
                                <TableHead className="text-right">Qty</TableHead>
                                <TableHead>Unit</TableHead>
                                <TableHead className="text-right">Harga Satuan</TableHead>
                                <TableHead className="text-right">Disc %</TableHead>
                                <TableHead className="text-right">Subtotal</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {invoice.items.map((item) => (
                                <TableRow key={item.id}>
                                    <TableCell>
                                        <div>
                                            <p className="font-medium">{item.item.itemName}</p>
                                            <p className="text-xs text-gray-500 font-mono">{item.itemCode}</p>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">{Number(item.quantity)}</TableCell>
                                    <TableCell>{item.unit}</TableCell>
                                    <TableCell className="text-right">
                                        {formatCurrency(Number(item.unitPrice))}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {Number(item.discountPercent)}%
                                    </TableCell>
                                    <TableCell className="text-right font-medium">
                                        {formatCurrency(Number(item.subtotal))}
                                    </TableCell>
                                </TableRow>
                            ))}
                            <TableRow>
                                <TableCell colSpan={5} className="text-right font-medium">
                                    Subtotal
                                </TableCell>
                                <TableCell className="text-right font-medium">
                                    {formatCurrency(Number(invoice.subtotal))}
                                </TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell colSpan={5} className="text-right font-medium">
                                    Diskon
                                </TableCell>
                                <TableCell className="text-right text-red-600">
                                    -{formatCurrency(Number(invoice.discountAmount))}
                                </TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell colSpan={5} className="text-right font-medium">
                                    Pajak (PPN)
                                </TableCell>
                                <TableCell className="text-right">
                                    {formatCurrency(Number(invoice.taxAmount))}
                                </TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell colSpan={5} className="text-right font-bold text-lg">
                                    Grand Total
                                </TableCell>
                                <TableCell className="text-right font-bold text-lg">
                                    {formatCurrency(Number(invoice.grandTotal))}
                                </TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}
