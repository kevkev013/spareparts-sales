import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ShieldX } from 'lucide-react'

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md text-center">
        <CardContent className="pt-8 pb-8">
          <div className="flex justify-center mb-4">
            <div className="bg-red-100 text-red-600 p-4 rounded-full">
              <ShieldX className="h-10 w-10" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Akses Ditolak</h1>
          <p className="text-gray-500 mb-6">
            Anda tidak memiliki akses ke halaman ini. Silakan hubungi administrator
            jika Anda membutuhkan akses.
          </p>
          <Link href="/dashboard">
            <Button>Kembali ke Dashboard</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}
