import { NextRequest, NextResponse } from 'next/server'
import { performBackup, isBackupConfigured } from '@/services/backup.service'

// GET /api/cron/backup — Vercel Cron endpoint (daily auto backup)
export async function GET(request: NextRequest) {
  // Verify Vercel Cron secret
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!isBackupConfigured()) {
    return NextResponse.json(
      { error: 'Google Sheets not configured' },
      { status: 400 }
    )
  }

  try {
    const result = await performBackup('cron')

    if (!result.success) {
      console.error('Cron backup failed:', result.error)
      return NextResponse.json(
        { error: 'Backup failed', details: result.error },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Cron backup completed successfully',
      result,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('Cron backup error:', message)
    return NextResponse.json(
      { error: 'Backup failed', message },
      { status: 500 }
    )
  }
}
