import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CustomerForm } from '@/components/forms/customer-form'
import { getCustomerById } from '@/services/customer.service'
import { notFound } from 'next/navigation'

export default async function EditCustomerPage({ params }: { params: { id: string } }) {
  const customerData = await getCustomerById(params.id)

  if (!customerData) {
    notFound()
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <Link href="/master/customers">
          <Button variant="ghost" size="sm">
            <ChevronLeft className="h-4 w-4 mr-2" />
            Kembali ke Daftar Customer
          </Button>
        </Link>
      </div>

      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Edit Customer</h1>
        <p className="text-gray-600">
          Update informasi untuk {customerData.customer.customerName}
        </p>
      </div>

      <CustomerForm mode="edit" customer={customerData.customer} />
    </div>
  )
}
