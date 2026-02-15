'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Truck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { usePermissions } from '@/hooks/use-permissions'

interface Props {
    soId: string
}

export function CreateDoButton({ soId }: Props) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const { can } = usePermissions()

    if (!can('delivery_orders.create')) {
        return null
    }

    const handleCreate = async () => {
        if (!confirm('Buat Delivery Order untuk pesanan ini? Sistem akan otomatis memilih stok (FIFO).')) {
            return
        }

        try {
            setLoading(true)
            const response = await fetch('/api/delivery-orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ soId }),
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.error || 'Failed to create delivery order')
            }

            const data = await response.json()
            alert('Delivery Order berhasil dibuat')
            router.push(`/sales/delivery-orders/${data.id}`)
        } catch (error: any) {
            alert(error.message || 'Gagal membuat delivery order')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Button onClick={handleCreate} disabled={loading}>
            <Truck className="h-4 w-4 mr-2" />
            {loading ? 'Creating...' : 'Buat Delivery Order'}
        </Button>
    )
}
