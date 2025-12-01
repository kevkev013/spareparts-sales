import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ItemForm } from '@/components/forms/item-form'

export default function CreateItemPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <Link href="/master/items">
          <Button variant="ghost" size="sm">
            <ChevronLeft className="h-4 w-4 mr-2" />
            Kembali ke Daftar Item
          </Button>
        </Link>
      </div>

      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Tambah Item Baru</h1>
        <p className="text-gray-600">Isi form di bawah untuk menambah sparepart baru</p>
      </div>

      <ItemForm mode="create" />
    </div>
  )
}
