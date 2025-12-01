import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { BatchForm } from '@/components/forms/batch-form'
import { getBatchById } from '@/services/batch.service'
import { notFound } from 'next/navigation'

export default async function EditBatchPage({ params }: { params: { id: string } }) {
  const batchData = await getBatchById(params.id)

  if (!batchData) {
    notFound()
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <Link href="/master/batches">
          <Button variant="ghost" size="sm">
            <ChevronLeft className="h-4 w-4 mr-2" />
            Kembali ke Daftar Batch
          </Button>
        </Link>
      </div>

      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Edit Batch</h1>
        <p className="text-gray-600">
          Update informasi untuk batch {batchData.batch.batchNumber}
        </p>
      </div>

      <BatchForm mode="edit" batch={batchData.batch} />
    </div>
  )
}
