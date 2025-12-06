'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Props {
    id: string
}

export function CompletePickingButton({ id }: Props) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)

    const handleComplete = async () => {
        if (!confirm('Apakah Anda yakin ingin menyelesaikan picking? Stok akan dikurangi.')) {
            return
        }

        try {
            setLoading(true)
            const response = await fetch(`/api/delivery-orders/${id}/complete-picking`, {
                method: 'POST',
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.error || 'Failed to complete picking')
            }

            alert('Picking berhasil diselesaikan')
            router.refresh()
        } catch (error: any) {
            alert(error.message || 'Gagal menyelesaikan picking')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Button onClick={handleComplete} disabled={loading}>
            <CheckCircle className="h-4 w-4 mr-2" />
            {loading ? 'Processing...' : 'Selesai Picking'}
        </Button>
    )
}
