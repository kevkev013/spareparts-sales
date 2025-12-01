import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { LocationForm } from '@/components/forms/location-form'

export default function CreateLocationPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <Link href="/master/locations">
          <Button variant="ghost" size="sm">
            <ChevronLeft className="h-4 w-4 mr-2" />
            Kembali ke Daftar Lokasi
          </Button>
        </Link>
      </div>

      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Tambah Lokasi Baru</h1>
        <p className="text-gray-600">Isi form di bawah untuk menambah lokasi gudang baru</p>
      </div>

      <LocationForm mode="create" />
    </div>
  )
}
