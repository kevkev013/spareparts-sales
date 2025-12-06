import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PaymentForm } from '@/components/forms/payment-form'

export default function CreatePaymentPage() {
    return (
        <div className="container mx-auto py-8">
            <div className="mb-6">
                <Link href="/payments">
                    <Button variant="ghost" size="sm">
                        <ChevronLeft className="h-4 w-4 mr-2" />
                        Kembali ke Daftar Pembayaran
                    </Button>
                </Link>
            </div>

            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2">Catat Pembayaran</h1>
                <p className="text-gray-600">Input data pembayaran dari customer</p>
            </div>

            <PaymentForm />
        </div>
    )
}
