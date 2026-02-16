'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AlertTriangle, Trash2, Database, Loader2 } from 'lucide-react'

export default function MaintenancePage() {
  const router = useRouter()
  const [confirmText, setConfirmText] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)
  const [isSeeding, setIsSeeding] = useState(false)
  const [result, setResult] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const isConfirmValid = confirmText === 'HAPUS SEMUA DATA'

  async function handleDeleteAll() {
    if (!isConfirmValid) return
    if (!confirm('PERINGATAN TERAKHIR: Semua data akan dihapus permanen. Lanjutkan?')) return

    setIsDeleting(true)
    setResult(null)

    try {
      const res = await fetch('/api/admin/reset-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmText }),
      })

      const data = await res.json()

      if (!res.ok) {
        setResult({ type: 'error', message: data.error || 'Gagal menghapus data' })
        return
      }

      setResult({ type: 'success', message: data.message })
      setConfirmText('')
      alert('Semua data berhasil dihapus!')
      router.push('/dashboard')
    } catch {
      setResult({ type: 'error', message: 'Terjadi kesalahan jaringan' })
    } finally {
      setIsDeleting(false)
    }
  }

  async function handleSeedSample() {
    if (!confirm('Isi database dengan sample data untuk demo? Data yang sudah ada tidak akan terhapus.')) return

    setIsSeeding(true)
    setResult(null)

    try {
      const res = await fetch('/api/admin/seed-sample', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      const data = await res.json()

      if (!res.ok) {
        setResult({ type: 'error', message: data.error || 'Gagal membuat sample data' })
        return
      }

      setResult({ type: 'success', message: data.message })
      alert('Sample data berhasil dibuat! Silakan cek halaman Reports.')
    } catch {
      setResult({ type: 'error', message: 'Terjadi kesalahan jaringan' })
    } finally {
      setIsSeeding(false)
    }
  }

  return (
    <div className="container mx-auto py-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Maintenance</h1>
        <p className="text-gray-600">Pengelolaan dan reset database</p>
      </div>

      {result && (
        <div
          className={`mb-6 p-4 rounded-lg border ${
            result.type === 'success'
              ? 'bg-green-50 border-green-200 text-green-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          {result.message}
        </div>
      )}

      {/* Seed Sample Data */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5 text-blue-600" />
            Isi Sample Data
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 mb-4">
            Mengisi database dengan data contoh untuk demo: 3 customer, 3 item, stok awal,
            dan transaksi lengkap (Quotation → Sales Order → Delivery → Shipment → Invoice → Payment).
          </p>
          <p className="text-sm text-gray-500 mb-4">
            Data yang sudah ada tidak akan dihapus. Cocok untuk dijalankan setelah reset data.
          </p>
          <Button onClick={handleSeedSample} disabled={isSeeding}>
            {isSeeding ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Membuat sample data...
              </>
            ) : (
              <>
                <Database className="mr-2 h-4 w-4" />
                Isi Sample Data
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Delete All Data */}
      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-700">
            <AlertTriangle className="h-5 w-5" />
            Zona Berbahaya
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <p className="text-sm text-red-800 font-medium mb-2">
              Hapus Semua Data
            </p>
            <p className="text-sm text-red-700">
              Menghapus <strong>SEMUA</strong> data di database: transaksi, master data, dan user
              (kecuali akun admin yang sedang login). Hanya roles dan konfigurasi pajak yang akan di-seed ulang.
            </p>
            <p className="text-sm text-red-600 mt-2 font-medium">
              Aksi ini TIDAK DAPAT dibatalkan!
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="confirmText" className="text-sm text-gray-700">
                Ketik <strong className="text-red-700 font-mono">HAPUS SEMUA DATA</strong> untuk mengaktifkan tombol:
              </Label>
              <Input
                id="confirmText"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="Ketik di sini..."
                className="mt-2 font-mono"
                disabled={isDeleting}
              />
            </div>

            <Button
              variant="destructive"
              onClick={handleDeleteAll}
              disabled={!isConfirmValid || isDeleting}
              className="w-full"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Menghapus semua data...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Hapus Semua Data
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
