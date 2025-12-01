import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ItemForm } from '@/components/forms/item-form'
import { getItemById } from '@/services/item.service'
import { notFound } from 'next/navigation'

export default async function EditItemPage({ params }: { params: { id: string } }) {
  const itemData = await getItemById(params.id)

  if (!itemData) {
    notFound()
  }

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
        <h1 className="text-3xl font-bold mb-2">Edit Item</h1>
        <p className="text-gray-600">
          Update informasi untuk {itemData.item.itemName}
        </p>
      </div>

      <ItemForm mode="edit" item={itemData.item} />
    </div>
  )
}
