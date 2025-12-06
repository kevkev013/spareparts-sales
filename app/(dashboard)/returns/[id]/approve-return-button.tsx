'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Props {
    id: string
}

export function ApproveReturnButton({ id }: Props) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)

    const handleApprove = async () => {
        if (!confirm('Approve retur ini? Stok akan dikembalikan (jika kondisi baik).')) {
            return
        }

        try {
            setLoading(true)
            const response = await fetch(`/api/returns/${id}/approve`, {
                method: 'POST',
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.error || 'Failed to approve return')
            }

            alert('Retur berhasil diapprove')
            router.refresh()
        } catch (error: any) {
            alert(error.message || 'Gagal approve retur')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Button onClick={handleApprove} disabled={loading}>
            <CheckCircle className="h-4 w-4 mr-2" />
            {loading ? 'Processing...' : 'Approve Retur'}
        </Button>
    )
}
