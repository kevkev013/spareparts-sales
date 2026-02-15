'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { usePermissions } from '@/hooks/use-permissions'

interface Props {
    soId: string
}

export function CreateInvoiceButton({ soId }: Props) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const { can } = usePermissions()

    if (!can('invoices.create')) {
        return null
    }

    const handleCreate = async () => {
        if (!confirm('Buat Invoice untuk pesanan ini?')) {
            return
        }

        try {
            setLoading(true)
            const response = await fetch('/api/invoices', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ soId }),
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.error || 'Failed to create invoice')
            }

            const data = await response.json()
            alert('Invoice berhasil dibuat')
            router.push(`/sales/invoices/${data.id}`)
        } catch (error: any) {
            alert(error.message || 'Gagal membuat invoice')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Button onClick={handleCreate} disabled={loading}>
            <FileText className="h-4 w-4 mr-2" />
            {loading ? 'Creating...' : 'Buat Invoice'}
        </Button>
    )
}
