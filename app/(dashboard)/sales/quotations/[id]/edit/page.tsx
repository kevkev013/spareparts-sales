import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SalesQuotationForm } from '@/components/forms/sales-quotation-form'
import { getSalesQuotationById } from '@/services/sales-quotation.service'
import { notFound } from 'next/navigation'

export default async function EditSalesQuotationPage({ params }: { params: { id: string } }) {
  const quotation = await getSalesQuotationById(params.id)

  if (!quotation) {
    notFound()
  }

  if (quotation.convertedToSo) {
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
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <p className="text-yellow-800 font-medium">
            Quotation ini sudah dikonversi ke Sales Order dan tidak dapat diedit.
          </p>
          <Link href={`/sales/quotations/${params.id}`} className="mt-4 inline-block">
            <Button>Lihat Detail</Button>
          </Link>
        </div>
      </div>
    )
  }

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
        <h1 className="text-3xl font-bold mb-2">Edit Sales Quotation</h1>
        <p className="text-gray-600">Update informasi untuk {quotation.sqNumber}</p>
      </div>

      <SalesQuotationForm mode="edit" quotation={quotation} />
    </div>
  )
}
