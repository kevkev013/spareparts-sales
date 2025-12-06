import Link from 'next/link'
import { Eye, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { getPayments } from '@/services/payment.service'
import { formatCurrency, formatDate } from '@/lib/utils'

interface PageProps {
    searchParams: {
        search?: string
        page?: string
    }
}

export default async function PaymentsPage({ searchParams }: PageProps) {
    const page = Number(searchParams.page) || 1
    const { payments, pagination } = await getPayments({
        search: searchParams.search,
        page,
        limit: 10,
    })

    return (
        <div className="container mx-auto py-8">
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold mb-2">Payments</h1>
                    <p className="text-gray-600">Daftar pembayaran dari customer</p>
                </div>
                <Link href="/payments/create">
                    <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Catat Pembayaran
                    </Button>
                </Link>
            </div>

            {/* Table */}
            <div className="border rounded-lg overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>No. Pembayaran</TableHead>
                            <TableHead>Tanggal</TableHead>
                            <TableHead>No. Invoice</TableHead>
                            <TableHead>Customer</TableHead>
                            <TableHead>Metode</TableHead>
                            <TableHead>Referensi</TableHead>
                            <TableHead className="text-right">Jumlah</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {payments.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                                    Tidak ada data pembayaran
                                </TableCell>
                            </TableRow>
                        ) : (
                            payments.map((p) => (
                                <TableRow key={p.id}>
                                    <TableCell className="font-mono font-medium">{p.paymentNumber}</TableCell>
                                    <TableCell>{formatDate(p.paymentDate)}</TableCell>
                                    <TableCell className="font-mono">{p.invoiceNumber}</TableCell>
                                    <TableCell>
                                        <div>
                                            <p className="font-medium">{p.customer.customerName}</p>
                                            <p className="text-sm text-gray-600 font-mono">{p.customerCode}</p>
                                        </div>
                                    </TableCell>
                                    <TableCell className="capitalize">
                                        {p.paymentMethod.replace('_', ' ')}
                                    </TableCell>
                                    <TableCell>{p.referenceNumber || '-'}</TableCell>
                                    <TableCell className="text-right font-medium">
                                        {formatCurrency(Number(p.amount))}
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
                            <Link href={`/payments?page=${pagination.page - 1}`}>Previous</Link>
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
                            <Link href={`/payments?page=${pagination.page + 1}`}>Next</Link>
                        )}
                    </Button>
                </div>
            )}
        </div>
    )
}
