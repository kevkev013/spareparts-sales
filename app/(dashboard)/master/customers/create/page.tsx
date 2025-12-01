import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CustomerForm } from '@/components/forms/customer-form'

export default function CreateCustomerPage() {
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
        <h1 className="text-3xl font-bold mb-2">Tambah Customer Baru</h1>
        <p className="text-gray-600">Isi form di bawah untuk menambah customer baru</p>
      </div>

      <CustomerForm mode="create" />
    </div>
  )
}
