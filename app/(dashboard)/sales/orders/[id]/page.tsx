import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronLeft, Edit } from 'lucide-react'
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
import { getSalesOrderById } from '@/services/sales-order.service'
import { formatCurrency, formatDate } from '@/lib/utils'
import { ORDER_STATUS } from '@/lib/constants'
import { PrintButton } from '@/components/ui/print-button'
import { CreateDoButton } from './create-do-button'
import { CreateInvoiceButton } from './create-invoice-button'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { hasPermission } from '@/lib/auth-helpers'

interface PageProps {
    params: {
        id: string
    }
}

export default async function SalesOrderDetailPage({ params }: PageProps) {
    const session = await getServerSession(authOptions)
    const permissions = session?.user?.permissions
    const order = await getSalesOrderById(params.id)

    if (!order) {
        notFound()
    }

    const getStatusBadge = (status: string) => {
        const variants: Record<string, any> = {
            confirmed: 'default',
            processing: 'secondary',
            partial_fulfilled: 'outline',
            fulfilled: 'default',
            cancelled: 'destructive',
        }
        return variants[status] || 'secondary'
    }

    const getStatusLabel = (status: string) => {
        const found = ORDER_STATUS.find((s) => s.value === status)
        return found?.label || status
    }

    return (
        <div className="container mx-auto py-8">
            <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/sales/orders">
                        <Button variant="ghost" size="sm">
                            <ChevronLeft className="h-4 w-4 mr-2" />
                            Kembali
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold flex items-center gap-3">
                            Sales Order {order.soNumber}
                            <Badge variant={getStatusBadge(order.status)}>
                                {getStatusLabel(order.status)}
                            </Badge>
                        </h1>
                    </div>
                </div>
                <div className="flex gap-2">
                    <PrintButton label="Cetak" permission="orders.print" />
                    {(order.status === 'confirmed' ||
                        order.status === 'processing' ||
                        order.status === 'partial_fulfilled') && (
                            <CreateDoButton soId={order.id} />
                        )}
                    {(order.status === 'fulfilled' || order.status === 'partial_fulfilled') && (
                        <CreateInvoiceButton soId={order.id} />
                    )}
                    {order.status !== 'fulfilled' && order.status !== 'cancelled' && hasPermission(permissions, 'orders.edit') && (
                        <Link href={`/sales/orders/${order.id}/edit`}>
                            <Button>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit Order
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
                                <p className="font-medium">{order.customer.customerName}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Kode Customer</p>
                                <p className="font-mono text-sm">{order.customerCode}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Alamat</p>
                                <p className="text-sm">{order.customer.address || '-'}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Kontak</p>
                                <p className="text-sm">
                                    {order.customer.phone || '-'} / {order.customer.email || '-'}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Order Info */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Informasi Order</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            <div>
                                <p className="text-sm text-gray-500">Tanggal Order</p>
                                <p className="font-medium">{formatDate(order.soDate)}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Referensi SQ</p>
                                <p className="font-mono text-sm">{order.sqNumber || '-'}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Tanggal Pengiriman</p>
                                <p className="font-medium">
                                    {order.deliveryDate ? formatDate(order.deliveryDate) : '-'}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Alamat Pengiriman</p>
                                <p className="text-sm">{order.deliveryAddress || '-'}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Notes */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Catatan</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-gray-600 whitespace-pre-wrap">
                            {order.notes || 'Tidak ada catatan'}
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Items Table */}
            <Card className="mb-8">
                <CardHeader>
                    <CardTitle>Item Order</CardTitle>
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
                            {order.items.map((item) => (
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
                                    {formatCurrency(Number(order.subtotal))}
                                </TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell colSpan={5} className="text-right font-medium">
                                    Diskon
                                </TableCell>
                                <TableCell className="text-right text-red-600">
                                    -{formatCurrency(Number(order.discountAmount))}
                                </TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell colSpan={5} className="text-right font-medium">
                                    Pajak (PPN)
                                </TableCell>
                                <TableCell className="text-right">
                                    {formatCurrency(Number(order.taxAmount))}
                                </TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell colSpan={5} className="text-right font-bold text-lg">
                                    Grand Total
                                </TableCell>
                                <TableCell className="text-right font-bold text-lg">
                                    {formatCurrency(Number(order.grandTotal))}
                                </TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}
