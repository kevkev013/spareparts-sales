import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ReturnForm } from '@/components/forms/return-form'

export default function CreateReturnPage() {
    return (
        <div className="container mx-auto py-8">
            <div className="mb-6">
                <Link href="/returns">
                    <Button variant="ghost" size="sm">
                        <ChevronLeft className="h-4 w-4 mr-2" />
                        Kembali ke Daftar Retur
                    </Button>
                </Link>
            </div>

            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2">Buat Retur Barang</h1>
                <p className="text-gray-600">Input data pengembalian barang dari customer</p>
            </div>

            <ReturnForm />
        </div>
    )
}
