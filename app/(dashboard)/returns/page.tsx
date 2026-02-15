import Link from 'next/link'
import { Eye, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PermissionGate } from '@/components/permission-gate'
import { Badge } from '@/components/ui/badge'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { getReturns } from '@/services/return.service'
import { formatDate } from '@/lib/utils'

interface PageProps {
    searchParams: {
        search?: string
        status?: string
        page?: string
    }
}

export default async function ReturnsPage({ searchParams }: PageProps) {
    const page = Number(searchParams.page) || 1
    const { returns, pagination } = await getReturns({
        search: searchParams.search,
        status: searchParams.status,
        page,
        limit: 10,
    })

    const getStatusBadge = (status: string) => {
        const variants: Record<string, any> = {
            pending: 'secondary',
            approved: 'default',
            rejected: 'destructive',
            completed: 'default',
        }
        return variants[status] || 'secondary'
    }

    return (
        <div className="container mx-auto py-8">
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold mb-2">Returns</h1>
                    <p className="text-gray-600">Kelola retur barang dari customer</p>
                </div>
                <PermissionGate permission="returns.create">
                    <Link href="/returns/create">
                        <Button>
                            <Plus className="h-4 w-4 mr-2" />
                            Buat Retur
                        </Button>
                    </Link>
                </PermissionGate>
            </div>

            {/* Table */}
            <div className="border rounded-lg overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>No. Retur</TableHead>
                            <TableHead>Tanggal</TableHead>
                            <TableHead>Customer</TableHead>
                            <TableHead>Ref SO</TableHead>
                            <TableHead>Items</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Aksi</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {returns.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                                    Tidak ada data retur
                                </TableCell>
                            </TableRow>
                        ) : (
                            returns.map((r) => (
                                <TableRow key={r.id}>
                                    <TableCell className="font-mono font-medium">{r.returnNumber}</TableCell>
                                    <TableCell>{formatDate(r.returnDate)}</TableCell>
                                    <TableCell>
                                        <div>
                                            <p className="font-medium">{r.customer.customerName}</p>
                                            <p className="text-sm text-gray-600 font-mono">{r.customerCode}</p>
                                        </div>
                                    </TableCell>
                                    <TableCell className="font-mono">{r.soNumber || '-'}</TableCell>
                                    <TableCell>{r.items.length} item</TableCell>
                                    <TableCell>
                                        <Badge variant={getStatusBadge(r.status)}>{r.status}</Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center justify-end gap-2">
                                            <Link href={`/returns/${r.id}`}>
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
                            <Link href={`/returns?page=${pagination.page - 1}`}>Previous</Link>
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
                            <Link href={`/returns?page=${pagination.page + 1}`}>Next</Link>
                        )}
                    </Button>
                </div>
            )}
        </div>
    )
}
