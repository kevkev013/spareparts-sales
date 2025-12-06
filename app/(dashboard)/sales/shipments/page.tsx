import Link from 'next/link'
import { Eye, Truck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { getShipments } from '@/services/shipment.service'
import { formatDate } from '@/lib/utils'

interface PageProps {
    searchParams: {
        search?: string
        status?: string
        page?: string
    }
}

export default async function ShipmentsPage({ searchParams }: PageProps) {
    const page = Number(searchParams.page) || 1
    const { shipments, pagination } = await getShipments({
        search: searchParams.search,
        status: searchParams.status,
        page,
        limit: 10,
    })

    const getStatusBadge = (status: string) => {
        const variants: Record<string, any> = {
            in_transit: 'secondary',
            delivered: 'default',
            cancelled: 'destructive',
        }
        return variants[status] || 'secondary'
    }

    return (
        <div className="container mx-auto py-8">
            <div className="mb-6">
                <h1 className="text-3xl font-bold mb-2">Shipments (Surat Jalan)</h1>
                <p className="text-gray-600">Kelola pengiriman barang ke customer</p>
            </div>

            {/* Table */}
            <div className="border rounded-lg overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nomor SJ</TableHead>
                            <TableHead>Tanggal</TableHead>
                            <TableHead>No. DO</TableHead>
                            <TableHead>Customer</TableHead>
                            <TableHead>Driver / Kendaraan</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Aksi</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {shipments.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                                    Tidak ada data shipment
                                </TableCell>
                            </TableRow>
                        ) : (
                            shipments.map((s) => (
                                <TableRow key={s.id}>
                                    <TableCell className="font-mono font-medium">{s.sjNumber}</TableCell>
                                    <TableCell>{formatDate(s.sjDate)}</TableCell>
                                    <TableCell className="font-mono">{s.doNumber}</TableCell>
                                    <TableCell>
                                        <div>
                                            <p className="font-medium">{s.customer.customerName}</p>
                                            <p className="text-sm text-gray-600 font-mono">{s.customerCode}</p>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="text-sm">
                                            <p>{s.driverName || '-'}</p>
                                            <p className="text-gray-500">{s.vehicleNumber}</p>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={getStatusBadge(s.status)}>{s.status}</Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center justify-end gap-2">
                                            <Link href={`/sales/shipments/${s.id}`}>
                                                <Button variant="ghost" size="sm">
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                            </Link>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
                <div className="mt-6 flex items-center justify-center gap-2">
                    <Button
                        variant="outline"
                        disabled={pagination.page === 1}
                        asChild={pagination.page !== 1}
                    >
                        {pagination.page === 1 ? (
                            <span>Previous</span>
                        ) : (
                            <Link href={`/sales/shipments?page=${pagination.page - 1}`}>Previous</Link>
                        )}
                    </Button>
                    <span className="text-sm text-gray-600">
                        Page {pagination.page} of {pagination.totalPages}
                    </span>
                    <Button
                        variant="outline"
                        disabled={pagination.page === pagination.totalPages}
                        asChild={pagination.page !== pagination.totalPages}
                    >
                        {pagination.page === pagination.totalPages ? (
                            <span>Next</span>
                        ) : (
                            <Link href={`/sales/shipments?page=${pagination.page + 1}`}>Next</Link>
                        )}
                    </Button>
                </div>
            )}
        </div>
    )
}
