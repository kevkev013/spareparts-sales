import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SalesQuotationForm } from '@/components/forms/sales-quotation-form'

export default function CreateSalesQuotationPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <Link href="/sales/quotations">
          <Button variant="ghost" size="sm">
            <ChevronLeft className="h-4 w-4 mr-2" />
            Kembali ke Daftar Quotation
          </Button>
        </Link>
      </div>

      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Buat Sales Quotation Baru</h1>
        <p className="text-gray-600">Isi form di bawah untuk membuat penawaran harga baru</p>
      </div>

      <SalesQuotationForm mode="create" />
    </div>
  )
}
