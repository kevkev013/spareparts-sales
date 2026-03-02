import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { performBackup, getBackupStatus, isBackupConfigured, initializeSheets } from '@/services/backup.service'
import { apiError } from '@/lib/api-error'

// POST /api/admin/backup — trigger manual backup
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (session.user.role !== 'Admin') {
      return NextResponse.json({ error: 'Hanya Admin yang dapat melakukan backup' }, { status: 403 })
    }

    if (!isBackupConfigured()) {
      return NextResponse.json(
        { error: 'Google Sheets belum dikonfigurasi. Set GOOGLE_SCRIPT_URL dan BACKUP_SECRET di environment variables.' },
        { status: 400 }
      )
    }

    const body = await request.json().catch(() => ({}))

    // Initialize sheet tabs if requested
    if (body.action === 'init') {
      const initResult = await initializeSheets()
      return NextResponse.json({
        message: `Sheet tabs berhasil dibuat: ${initResult.created.length} baru dari ${initResult.total} total.`,
        result: initResult,
      })
    }

    const result = await performBackup('manual')

    if (!result.success) {
      return NextResponse.json(
        { error: 'Backup gagal', details: result.error },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: `Backup berhasil! ${result.totalRows} baris dari ${result.tables.length} tabel dalam ${(result.duration / 1000).toFixed(1)} detik.`,
      result,
    })
  } catch (error) {
    return apiError(error, 'Gagal melakukan backup')
  }
}

// GET /api/admin/backup — get backup status
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (session.user.role !== 'Admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    if (!isBackupConfigured()) {
      return NextResponse.json({ configured: false, status: null })
    }

    const status = await getBackupStatus()
    return NextResponse.json({ configured: true, status })
  } catch (error) {
    return apiError(error, 'Gagal mengambil status backup')
  }
}
