'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Props {
    id: string
}

export function MarkDeliveredButton({ id }: Props) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)

    const handleMarkDelivered = async () => {
        if (!confirm('Tandai pengiriman ini sebagai sudah sampai (delivered)?')) {
            return
        }

        try {
            setLoading(true)
            const response = await fetch(`/api/shipments/${id}/mark-delivered`, {
                method: 'POST',
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.error || 'Failed to mark as delivered')
            }

            alert('Shipment berhasil ditandai sebagai delivered')
            router.refresh()
        } catch (error: any) {
            alert(error.message || 'Gagal update status')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Button onClick={handleMarkDelivered} disabled={loading}>
            <CheckCircle className="h-4 w-4 mr-2" />
            {loading ? 'Processing...' : 'Tandai Sampai'}
        </Button>
    )
}
