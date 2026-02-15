export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronLeft, CheckCircle, Truck } from 'lucide-react'
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
import { getDeliveryOrderById } from '@/services/delivery-order.service'
import { formatDate } from '@/lib/utils'
import { DELIVERY_STATUS } from '@/lib/constants'
import { PrintButton } from '@/components/ui/print-button'
import { CompletePickingButton } from './complete-picking-button'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { hasPermission } from '@/lib/auth-helpers'

interface PageProps {
    params: {
        id: string
    }
}

export default async function DeliveryOrderDetailPage({ params }: PageProps) {
    const session = await getServerSession(authOptions)
    const permissions = session?.user?.permissions
    const deliveryOrder = await getDeliveryOrderById(params.id)

    if (!deliveryOrder) {
        notFound()
    }

    const getStatusBadge = (status: string) => {
        const variants: Record<string, any> = {
            picking: 'secondary',
            picked: 'default',
            shipped: 'default',
        }
        return variants[status] || 'secondary'
    }

    const getStatusLabel = (status: string) => {
        const found = DELIVERY_STATUS.find((s) => s.value === status)
        return found?.label || status
    }

    return (
        <div className="container mx-auto py-8">
            <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/sales/delivery-orders">
                        <Button variant="ghost" size="sm">
                            <ChevronLeft className="h-4 w-4 mr-2" />
                            Kembali
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold flex items-center gap-3">
                            Delivery Order {deliveryOrder.doNumber}
                            <Badge variant={getStatusBadge(deliveryOrder.status)}>
                                {getStatusLabel(deliveryOrder.status)}
                            </Badge>
                        </h1>
                    </div>
                </div>
                <div className="flex gap-2">
                    <PrintButton label="Cetak Picking List" permission="delivery_orders.print" />
                    {deliveryOrder.status === 'picking' && (
                        <CompletePickingButton id={deliveryOrder.id} />
                    )}
                    {deliveryOrder.status === 'picked' && hasPermission(permissions, 'shipments.create') && (
                        <Link href={`/sales/shipments/create?doId=${deliveryOrder.id}`}>
                            <Button>
                                <Truck className="h-4 w-4 mr-2" />
                                Buat Pengiriman (Surat Jalan)
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
                                <p className="font-medium">{deliveryOrder.customer.customerName}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Kode Customer</p>
                                <p className="font-mono text-sm">{deliveryOrder.customerCode}</p>
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
                                <p className="text-sm text-gray-500">Tanggal DO</p>
                                <p className="font-medium">{formatDate(deliveryOrder.doDate)}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Referensi SO</p>
                                <Link
                                    href={`/sales/orders/${deliveryOrder.soId}`}
                                    className="text-blue-600 hover:underline font-mono text-sm"
                                >
                                    {deliveryOrder.soNumber}
                                </Link>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Picker</p>
                                <p className="font-medium">{deliveryOrder.pickerName || '-'}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Status Info */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Status Picking</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            <div>
                                <p className="text-sm text-gray-500">Status</p>
                                <Badge variant={getStatusBadge(deliveryOrder.status)}>
                                    {getStatusLabel(deliveryOrder.status)}
                                </Badge>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Waktu Picked</p>
                                <p className="font-medium">
                                    {deliveryOrder.pickedAt ? formatDate(deliveryOrder.pickedAt) : '-'}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Items Table */}
            <Card className="mb-8">
                <CardHeader>
                    <CardTitle>Item Picking</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Item</TableHead>
                                <TableHead>Batch Number</TableHead>
                                <TableHead>Lokasi</TableHead>
                                <TableHead className="text-right">Ordered Qty</TableHead>
                                <TableHead className="text-right">Picked Qty</TableHead>
                                <TableHead>Unit</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {deliveryOrder.items.map((item) => (
                                <TableRow key={item.id}>
                                    <TableCell>
                                        <div>
                                            <p className="font-medium">{item.item.itemName}</p>
                                            <p className="text-xs text-gray-500 font-mono">{item.itemCode}</p>
                                        </div>
                                    </TableCell>
                                    <TableCell className="font-mono">{item.batchNumber}</TableCell>
                                    <TableCell className="font-mono">{item.locationCode}</TableCell>
                                    <TableCell className="text-right">{Number(item.orderedQty)}</TableCell>
                                    <TableCell className="text-right font-bold">{Number(item.pickedQty)}</TableCell>
                                    <TableCell>{item.unit}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}
