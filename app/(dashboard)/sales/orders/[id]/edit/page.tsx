import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SalesOrderForm } from '@/components/forms/sales-order-form'
import { getSalesOrderById } from '@/services/sales-order.service'

interface PageProps {
    params: {
        id: string
    }
}

export default async function EditSalesOrderPage({ params }: PageProps) {
    const order = await getSalesOrderById(params.id)

    if (!order) {
        notFound()
    }

    if (order.status === 'fulfilled' || order.status === 'cancelled') {
        return (
            <div className="container mx-auto py-8">
                <div className="text-center">
                    <h1 className="text-2xl font-bold mb-4">Tidak dapat mengedit order</h1>
                    <p className="text-gray-600 mb-6">
                        Order dengan status {order.status} tidak dapat diedit.
                    </p>
                    <Link href={`/sales/orders/${order.id}`}>
                        <Button>Kembali ke Detail Order</Button>
                    </Link>
                </div>
            </div>
        )
    }

    return (
        <div className="container mx-auto py-8">
            <div className="mb-6">
                <Link href={`/sales/orders/${order.id}`}>
                    <Button variant="ghost" size="sm">
                        <ChevronLeft className="h-4 w-4 mr-2" />
                        Kembali ke Detail Order
                    </Button>
                </Link>
            </div>

            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2">Edit Sales Order</h1>
                <p className="text-gray-600">Update informasi sales order {order.soNumber}</p>
            </div>

            <SalesOrderForm mode="edit" order={order} />
        </div>
    )
}
