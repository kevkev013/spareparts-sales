import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ShipmentForm } from '@/components/forms/shipment-form'

export default function CreateShipmentPage() {
    return (
        <div className="container mx-auto py-8">
            <div className="mb-6">
                <Link href="/sales/delivery-orders">
                    <Button variant="ghost" size="sm">
                        <ChevronLeft className="h-4 w-4 mr-2" />
                        Kembali ke Delivery Orders
                    </Button>
                </Link>
            </div>

            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2">Buat Surat Jalan</h1>
                <p className="text-gray-600">Isi informasi pengiriman untuk membuat surat jalan</p>
            </div>

            <ShipmentForm />
        </div>
    )
}
