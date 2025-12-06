import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronLeft, CheckCircle, XCircle } from 'lucide-react'
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
import { getReturnById } from '@/services/return.service'
import { formatDate } from '@/lib/utils'
import { ApproveReturnButton } from './approve-return-button'

interface PageProps {
    params: {
        id: string
    }
}

export default async function ReturnDetailPage({ params }: PageProps) {
    const returnRecord = await getReturnById(params.id)

    if (!returnRecord) {
        notFound()
    }

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
                <div className="flex items-center gap-4">
                    <Link href="/returns">
                        <Button variant="ghost" size="sm">
                            <ChevronLeft className="h-4 w-4 mr-2" />
                            Kembali
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold flex items-center gap-3">
                            Retur {returnRecord.returnNumber}
                            <Badge variant={getStatusBadge(returnRecord.status)}>
                                {returnRecord.status}
                            </Badge>
                        </h1>
                    </div>
                </div>
                <div className="flex gap-2">
                    {returnRecord.status === 'pending' && (
                        <ApproveReturnButton id={returnRecord.id} />
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {/* Customer Info */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Informasi Customer</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            <div>
                                <p className="text-sm text-gray-500">Nama Customer</p>
                                <p className="font-medium">{returnRecord.customer.customerName}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Kode Customer</p>
                                <p className="font-mono text-sm">{returnRecord.customerCode}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Return Info */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Informasi Retur</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            <div>
                                <p className="text-sm text-gray-500">Tanggal Retur</p>
                                <p className="font-medium">{formatDate(returnRecord.returnDate)}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Referensi SO</p>
                                <p className="font-mono text-sm">{returnRecord.soNumber || '-'}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Alasan</p>
                                <p className="text-sm">{returnRecord.reason || '-'}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Items Table */}
            <Card className="mb-8">
                <CardHeader>
                    <CardTitle>Item Retur</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Item</TableHead>
                                <TableHead className="text-right">Qty</TableHead>
                                <TableHead>Unit</TableHead>
                                <TableHead>Kondisi</TableHead>
                                <TableHead>Catatan</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {returnRecord.items.map((item) => (
                                <TableRow key={item.id}>
                                    <TableCell>
                                        <div>
                                            <p className="font-medium">{item.item.itemName}</p>
                                            <p className="text-xs text-gray-500 font-mono">{item.itemCode}</p>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">{Number(item.quantity)}</TableCell>
                                    <TableCell>{item.unit}</TableCell>
                                    <TableCell className="capitalize">{item.condition || '-'}</TableCell>
                                    <TableCell>{item.notes || '-'}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}
