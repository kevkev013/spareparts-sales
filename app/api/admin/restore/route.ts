import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { performRestore, isBackupConfigured } from '@/services/backup.service'
import { apiError } from '@/lib/api-error'

// POST /api/admin/restore — restore data from Google Sheets backup
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (session.user.role !== 'Admin') {
      return NextResponse.json({ error: 'Hanya Admin yang dapat melakukan restore' }, { status: 403 })
    }

    if (!isBackupConfigured()) {
      return NextResponse.json(
        { error: 'Google Sheets belum dikonfigurasi. Set GOOGLE_SCRIPT_URL dan BACKUP_SECRET di environment variables.' },
        { status: 400 }
      )
    }

    const body = await request.json()
    if (body.confirmText !== 'RESTORE DATA') {
      return NextResponse.json(
        { error: 'Konfirmasi tidak valid. Ketik "RESTORE DATA" untuk melanjutkan.' },
        { status: 400 }
      )
    }

    const result = await performRestore()

    if (!result.success) {
      return NextResponse.json(
        { error: 'Restore gagal. Data tidak berubah (rollback).', details: result.error },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: `Restore berhasil! ${result.totalRows} baris ke ${result.tables.length} tabel dalam ${(result.duration / 1000).toFixed(1)} detik.`,
      result,
    })
  } catch (error) {
    return apiError(error, 'Gagal melakukan restore')
  }
}
