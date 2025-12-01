import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { LocationForm } from '@/components/forms/location-form'
import { getLocationById } from '@/services/location.service'
import { notFound } from 'next/navigation'

export default async function EditLocationPage({ params }: { params: { id: string } }) {
  const locationData = await getLocationById(params.id)

  if (!locationData) {
    notFound()
  }

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
        <h1 className="text-3xl font-bold mb-2">Edit Lokasi</h1>
        <p className="text-gray-600">
          Update informasi untuk {locationData.location.locationName}
        </p>
      </div>

      <LocationForm mode="edit" location={locationData.location} />
    </div>
  )
}
