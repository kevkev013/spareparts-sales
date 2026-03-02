'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  AlertTriangle, Trash2, Database, Loader2, CloudUpload, Download,
  Clock, CheckCircle2, XCircle, BookOpen, ChevronDown, ChevronUp, Copy, Check
} from 'lucide-react'

// ============================================
// APPS SCRIPT CODE (embedded for copy-paste)
// ============================================

const APPS_SCRIPT_CODE = `/**
 * Google Apps Script - Backup Bridge untuk Spareparts Sales
 * Paste seluruh kode ini di Extensions > Apps Script
 */

// ========== GANTI INI DENGAN PASSWORD RAHASIA KAMU ==========
const SECRET_KEY = 'ganti-dengan-password-rahasia-kamu';
// =============================================================

const SHEET_NAMES = [
  'Role', 'User', 'TaxMaster', 'TaxHistory',
  'Customer', 'Item', 'UnitConversion', 'UnitPrice',
  'Location', 'Batch', 'Stock', 'PriceMovement',
  'SalesQuotation', 'SalesQuotationItem', 'SalesOrder', 'SalesOrderItem',
  'DeliveryOrder', 'DeliveryOrderItem', 'Shipment',
  'Invoice', 'InvoiceItem', 'Payment', 'Return', 'ReturnItem',
  '_BackupLog'
];

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    if (data.secret !== SECRET_KEY) {
      return jsonResponse({ success: false, error: 'Unauthorized' });
    }
    switch (data.action) {
      case 'init':
        return handleInit();
      case 'backup':
        return handleBackup(data);
      case 'restore':
        return handleRestore(data);
      case 'status':
        return handleStatus();
      case 'log':
        return handleLog(data);
      default:
        return jsonResponse({ success: false, error: 'Unknown action: ' + data.action });
    }
  } catch (err) {
    return jsonResponse({ success: false, error: err.message });
  }
}

function doGet(e) {
  return jsonResponse({ success: true, message: 'Spareparts Backup Script is running.' });
}

function handleInit() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const existing = ss.getSheets().map(s => s.getName());
  const created = [];
  for (const name of SHEET_NAMES) {
    if (!existing.includes(name)) {
      ss.insertSheet(name);
      created.push(name);
    }
  }
  const sheet1 = ss.getSheetByName('Sheet1');
  if (sheet1 && !SHEET_NAMES.includes('Sheet1') && ss.getSheets().length > 1) {
    ss.deleteSheet(sheet1);
  }
  return jsonResponse({ success: true, created: created, total: SHEET_NAMES.length });
}

function handleBackup(data) {
  if (!data.table || !data.headers) {
    return jsonResponse({ success: false, error: 'Missing table or headers' });
  }
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(data.table);
  if (!sheet) {
    sheet = ss.insertSheet(data.table);
  }
  sheet.clear();
  const headers = data.headers;
  if (headers.length > 0) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
    sheet.setFrozenRows(1);
  }
  const rows = data.rows || [];
  if (rows.length > 0) {
    sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
  }
  return jsonResponse({ success: true, table: data.table, rowCount: rows.length });
}

function handleRestore(data) {
  if (!data.table) {
    return jsonResponse({ success: false, error: 'Missing table name' });
  }
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(data.table);
  if (!sheet) {
    return jsonResponse({ success: true, table: data.table, headers: [], rows: [], rowCount: 0 });
  }
  const lastRow = sheet.getLastRow();
  const lastCol = sheet.getLastColumn();
  if (lastRow === 0 || lastCol === 0) {
    return jsonResponse({ success: true, table: data.table, headers: [], rows: [], rowCount: 0 });
  }
  const allData = sheet.getRange(1, 1, lastRow, lastCol).getValues();
  const headers = allData[0].map(h => String(h));
  const rows = allData.slice(1).map(row => row.map(cell => {
    if (cell instanceof Date) return cell.toISOString();
    if (cell === null || cell === undefined) return '';
    return String(cell);
  }));
  return jsonResponse({ success: true, table: data.table, headers: headers, rows: rows, rowCount: rows.length });
}

function handleStatus() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('_BackupLog');
  if (!sheet || sheet.getLastRow() < 2) {
    return jsonResponse({ success: true, status: null });
  }
  const lastRow = sheet.getLastRow();
  const lastCol = sheet.getLastColumn();
  const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  const lastEntry = sheet.getRange(lastRow, 1, 1, lastCol).getValues()[0];
  const status = {};
  for (let i = 0; i < headers.length; i++) {
    status[headers[i]] = String(lastEntry[i]);
  }
  return jsonResponse({ success: true, status: status });
}

function handleLog(data) {
  if (!data.entry) {
    return jsonResponse({ success: false, error: 'Missing log entry' });
  }
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName('_BackupLog');
  if (!sheet) {
    sheet = ss.insertSheet('_BackupLog');
  }
  if (sheet.getLastRow() === 0) {
    const headers = ['timestamp', 'triggeredBy', 'duration', 'totalRows', 'tables'];
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
    sheet.setFrozenRows(1);
  }
  const entry = data.entry;
  const row = [
    entry.timestamp || new Date().toISOString(),
    entry.triggeredBy || 'unknown',
    entry.duration || 0,
    entry.totalRows || 0,
    entry.tables || ''
  ];
  sheet.appendRow(row);
  return jsonResponse({ success: true });
}

function jsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}`

// ============================================
// TYPES
// ============================================

interface BackupStatus {
  timestamp: string
  triggeredBy: string
  duration: string
  totalRows: string
  tables: string
}

// ============================================
// COMPONENT
// ============================================

export default function MaintenancePage() {
  const router = useRouter()
  const [confirmText, setConfirmText] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)
  const [isSeeding, setIsSeeding] = useState(false)
  const [result, setResult] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  // Backup/Restore state
  const [isBackingUp, setIsBackingUp] = useState(false)
  const [isRestoring, setIsRestoring] = useState(false)
  const [isInitializing, setIsInitializing] = useState(false)
  const [restoreConfirmText, setRestoreConfirmText] = useState('')
  const [backupConfigured, setBackupConfigured] = useState<boolean | null>(null)
  const [backupStatus, setBackupStatus] = useState<BackupStatus | null>(null)

  // Setup guide state
  const [showSetupGuide, setShowSetupGuide] = useState(false)
  const [copied, setCopied] = useState(false)

  const isConfirmValid = confirmText === 'HAPUS SEMUA DATA'
  const isRestoreConfirmValid = restoreConfirmText === 'RESTORE DATA'

  const loadBackupStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/backup')
      if (res.ok) {
        const data = await res.json()
        setBackupConfigured(data.configured)
        setBackupStatus(data.status)
      }
    } catch {
      // Silently fail
    }
  }, [])

  useEffect(() => {
    loadBackupStatus()
  }, [loadBackupStatus])

  async function handleCopyScript() {
    try {
      await navigator.clipboard.writeText(APPS_SCRIPT_CODE)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement('textarea')
      textarea.value = APPS_SCRIPT_CODE
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  async function handleInitSheets() {
    setIsInitializing(true)
    setResult(null)

    try {
      const res = await fetch('/api/admin/backup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'init' }),
      })

      const data = await res.json()

      if (!res.ok) {
        setResult({ type: 'error', message: data.error || 'Gagal inisialisasi sheet' })
        return
      }

      setResult({ type: 'success', message: data.message })
    } catch {
      setResult({ type: 'error', message: 'Terjadi kesalahan jaringan' })
    } finally {
      setIsInitializing(false)
    }
  }

  async function handleBackup() {
    if (!confirm('Backup semua data ke Google Sheets? Backup sebelumnya akan ditimpa.')) return

    setIsBackingUp(true)
    setResult(null)

    try {
      const res = await fetch('/api/admin/backup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })

      const data = await res.json()

      if (!res.ok) {
        setResult({ type: 'error', message: data.error || data.details || 'Gagal melakukan backup' })
        return
      }

      setResult({ type: 'success', message: data.message })
      alert('Backup berhasil! Cek Google Sheets kamu.')
      await loadBackupStatus()
    } catch {
      setResult({ type: 'error', message: 'Terjadi kesalahan jaringan' })
    } finally {
      setIsBackingUp(false)
    }
  }

  async function handleRestore() {
    if (!isRestoreConfirmValid) return
    if (!confirm('PERINGATAN: Semua data saat ini akan DIGANTI dengan data dari backup. Lanjutkan?')) return

    setIsRestoring(true)
    setResult(null)

    try {
      const res = await fetch('/api/admin/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmText: restoreConfirmText }),
      })

      const data = await res.json()

      if (!res.ok) {
        setResult({ type: 'error', message: data.error || data.details || 'Gagal melakukan restore' })
        return
      }

      setResult({ type: 'success', message: data.message })
      setRestoreConfirmText('')
      alert('Restore berhasil! Data telah dipulihkan dari backup.')
      router.push('/dashboard')
    } catch {
      setResult({ type: 'error', message: 'Terjadi kesalahan jaringan' })
    } finally {
      setIsRestoring(false)
    }
  }

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

  function formatBackupTime(isoString: string): string {
    try {
      const date = new Date(isoString)
      return date.toLocaleString('id-ID', {
        dateStyle: 'medium',
        timeStyle: 'short',
      })
    } catch {
      return isoString
    }
  }

  return (
    <div className="container mx-auto py-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Maintenance</h1>
        <p className="text-gray-600">Pengelolaan database, backup, dan restore</p>
      </div>

      {result && (
        <div
          className={`mb-6 p-4 rounded-lg border ${
            result.type === 'success'
              ? 'bg-green-50 border-green-200 text-green-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          <div className="flex items-start gap-2">
            {result.type === 'success' ? (
              <CheckCircle2 className="h-5 w-5 mt-0.5 shrink-0" />
            ) : (
              <XCircle className="h-5 w-5 mt-0.5 shrink-0" />
            )}
            <span>{result.message}</span>
          </div>
        </div>
      )}

      {/* ============================================ */}
      {/* PANDUAN SETUP AUTO BACKUP                    */}
      {/* ============================================ */}
      <Card className="mb-8 border-emerald-200">
        <CardHeader>
          <CardTitle
            className="flex items-center justify-between cursor-pointer"
            onClick={() => setShowSetupGuide(!showSetupGuide)}
          >
            <div className="flex items-center gap-2 text-emerald-700">
              <BookOpen className="h-5 w-5" />
              Panduan Setup Auto Backup
            </div>
            {showSetupGuide ? (
              <ChevronUp className="h-5 w-5 text-gray-400" />
            ) : (
              <ChevronDown className="h-5 w-5 text-gray-400" />
            )}
          </CardTitle>
        </CardHeader>

        {showSetupGuide && (
          <CardContent>
            <div className="space-y-6 text-sm">
              {/* Penjelasan Singkat */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                <p className="text-emerald-800 font-medium mb-2">Apa itu Auto Backup?</p>
                <p className="text-emerald-700">
                  Sistem akan otomatis backup seluruh database (24 tabel) ke Google Sheets setiap hari jam 02:00 WIB.
                  Google Sheet tetap <strong>private</strong> (hanya kamu yang bisa akses).
                  Kamu juga bisa backup manual dan restore data kapan saja dari halaman ini.
                </p>
              </div>

              {/* Step 1 */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  <span className="bg-emerald-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs">1</span>
                  Buat Google Spreadsheet Baru
                </h3>
                <div className="ml-8 text-gray-600 space-y-1">
                  <p>Buka <strong>Google Sheets</strong> (sheets.google.com) dan buat spreadsheet baru.</p>
                  <p>Beri nama misalnya: <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">Backup Spareparts Sales</code></p>
                  <p className="text-gray-500">Spreadsheet ini tetap private, tidak perlu di-share ke siapapun.</p>
                </div>
              </div>

              {/* Step 2 */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  <span className="bg-emerald-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs">2</span>
                  Buka Apps Script Editor
                </h3>
                <div className="ml-8 text-gray-600 space-y-1">
                  <p>Di spreadsheet yang baru dibuat, klik menu <strong>Extensions</strong> (Ekstensi) lalu pilih <strong>Apps Script</strong>.</p>
                  <p>Akan terbuka editor kode baru di tab terpisah.</p>
                </div>
              </div>

              {/* Step 3 */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  <span className="bg-emerald-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs">3</span>
                  Paste Kode Script
                </h3>
                <div className="ml-8 text-gray-600 space-y-2">
                  <p><strong>Hapus semua kode</strong> yang sudah ada di editor, lalu paste seluruh kode di bawah ini:</p>

                  {/* Copy button */}
                  <div className="flex justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCopyScript}
                      className="gap-1.5"
                    >
                      {copied ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-green-600" />
                          <span className="text-green-600">Tersalin!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5" />
                          Salin Kode
                        </>
                      )}
                    </Button>
                  </div>

                  {/* Code block */}
                  <div className="relative">
                    <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 overflow-x-auto text-xs leading-relaxed max-h-80 overflow-y-auto">
                      {APPS_SCRIPT_CODE}
                    </pre>
                  </div>
                </div>
              </div>

              {/* Step 4 */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  <span className="bg-emerald-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs">4</span>
                  Ganti SECRET_KEY
                </h3>
                <div className="ml-8 text-gray-600 space-y-2">
                  <p>Di baris paling atas kode, cari:</p>
                  <code className="block bg-gray-100 px-3 py-2 rounded text-xs">
                    {`const SECRET_KEY = 'ganti-dengan-password-rahasia-kamu';`}
                  </code>
                  <p>Ganti <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">ganti-dengan-password-rahasia-kamu</code> dengan password rahasia buatan kamu sendiri.</p>
                  <p>Contoh: <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">backup-toko-abc-2025</code></p>
                  <p className="text-amber-600 font-medium">Ingat password ini! Nanti akan dipakai lagi di langkah 7.</p>
                </div>
              </div>

              {/* Step 5 */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  <span className="bg-emerald-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs">5</span>
                  Deploy sebagai Web App
                </h3>
                <div className="ml-8 text-gray-600 space-y-2">
                  <p>Di Apps Script editor:</p>
                  <ol className="list-decimal ml-4 space-y-1">
                    <li>Klik tombol <strong>Deploy</strong> (pojok kanan atas) lalu pilih <strong>New deployment</strong></li>
                    <li>Klik ikon gear di sebelah &ldquo;Select type&rdquo;, pilih <strong>Web app</strong></li>
                    <li>Isi deskripsi (misal: &ldquo;Backup Bridge&rdquo;)</li>
                    <li>Execute as: pilih <strong>Me</strong></li>
                    <li>Who has access: pilih <strong>Anyone</strong></li>
                    <li>Klik <strong>Deploy</strong></li>
                    <li>Klik <strong>Authorize access</strong>, pilih akun Google kamu, lalu klik <strong>Allow</strong></li>
                  </ol>
                </div>
              </div>

              {/* Step 6 */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  <span className="bg-emerald-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs">6</span>
                  Copy Web App URL
                </h3>
                <div className="ml-8 text-gray-600 space-y-1">
                  <p>Setelah deploy berhasil, akan muncul <strong>Web app URL</strong>.</p>
                  <p>Copy URL tersebut. Formatnya seperti:</p>
                  <code className="block bg-gray-100 px-3 py-2 rounded text-xs break-all">
                    https://script.google.com/macros/s/AKfycbx.../exec
                  </code>
                </div>
              </div>

              {/* Step 7 */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  <span className="bg-emerald-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs">7</span>
                  Set Environment Variables di Vercel
                </h3>
                <div className="ml-8 text-gray-600 space-y-3">
                  <p>Buka <strong>Vercel Dashboard</strong> &rarr; project kamu &rarr; <strong>Settings</strong> &rarr; <strong>Environment Variables</strong>.</p>
                  <p>Tambahkan 3 variable berikut:</p>

                  <div className="bg-gray-50 border rounded-lg overflow-hidden">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-gray-100 border-b">
                          <th className="text-left px-3 py-2 font-semibold">Variable</th>
                          <th className="text-left px-3 py-2 font-semibold">Isi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        <tr>
                          <td className="px-3 py-2 font-mono font-medium text-blue-700">GOOGLE_SCRIPT_URL</td>
                          <td className="px-3 py-2">URL Web App dari langkah 6</td>
                        </tr>
                        <tr>
                          <td className="px-3 py-2 font-mono font-medium text-blue-700">BACKUP_SECRET</td>
                          <td className="px-3 py-2">
                            Password yang <strong>sama</strong> dengan SECRET_KEY di langkah 4
                          </td>
                        </tr>
                        <tr>
                          <td className="px-3 py-2 font-mono font-medium text-blue-700">CRON_SECRET</td>
                          <td className="px-3 py-2">
                            Password <strong>berbeda</strong>, random string untuk verifikasi cron
                            <br />
                            <span className="text-gray-500">(buat sendiri, misal: cron-xyz-123-random)</span>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                    <p className="text-amber-800 font-medium text-xs mb-1">Catatan Penting:</p>
                    <ul className="text-amber-700 text-xs space-y-1 list-disc ml-4">
                      <li><strong>BACKUP_SECRET</strong> dan <strong>SECRET_KEY</strong> (di script) harus <strong>SAMA persis</strong> &mdash; ini pasangan untuk verifikasi.</li>
                      <li><strong>CRON_SECRET</strong> isinya <strong>BERBEDA</strong> dari BACKUP_SECRET &mdash; ini khusus untuk Vercel Cron.</li>
                      <li>Setelah menambahkan env vars, klik <strong>Redeploy</strong> supaya perubahan aktif.</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Step 8 */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  <span className="bg-emerald-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs">8</span>
                  Inisialisasi & Test Backup
                </h3>
                <div className="ml-8 text-gray-600 space-y-2">
                  <p>Setelah redeploy selesai:</p>
                  <ol className="list-decimal ml-4 space-y-1">
                    <li>Kembali ke halaman ini (Settings &rarr; Maintenance)</li>
                    <li>Klik tombol <strong>&ldquo;Inisialisasi Tabs&rdquo;</strong> di bawah &mdash; ini akan membuat 25 tab sheet otomatis</li>
                    <li>Klik tombol <strong>&ldquo;Backup Sekarang&rdquo;</strong> untuk test backup pertama</li>
                    <li>Buka Google Sheets kamu, cek apakah data sudah masuk di setiap tab</li>
                  </ol>
                  <p className="text-emerald-700 font-medium mt-2">
                    Selesai! Setelah ini, backup akan berjalan otomatis setiap hari jam 02:00 WIB.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* ============================================ */}
      {/* BACKUP KE GOOGLE SHEETS                     */}
      {/* ============================================ */}
      <Card className="mb-8 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-700">
            <CloudUpload className="h-5 w-5" />
            Backup ke Google Sheets
          </CardTitle>
        </CardHeader>
        <CardContent>
          {backupConfigured === false ? (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-800 font-medium mb-1">
                Google Sheets belum dikonfigurasi
              </p>
              <p className="text-sm text-yellow-700 mb-3">
                Environment variables <code className="bg-yellow-100 px-1 rounded">GOOGLE_SCRIPT_URL</code> dan{' '}
                <code className="bg-yellow-100 px-1 rounded">BACKUP_SECRET</code> belum diset.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSetupGuide(true)}
              >
                <BookOpen className="mr-2 h-4 w-4" />
                Lihat Panduan Setup
              </Button>
            </div>
          ) : (
            <>
              <p className="text-sm text-gray-600 mb-4">
                Backup semua data (24 tabel) ke Google Sheets. Backup otomatis berjalan setiap hari jam 02:00 WIB.
                Kamu juga bisa trigger backup manual kapan saja.
              </p>

              {/* Backup Status */}
              {backupStatus ? (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-800">Backup Terakhir</span>
                  </div>
                  <div className="text-sm text-blue-700 space-y-1">
                    <p>Waktu: {formatBackupTime(backupStatus.timestamp)}</p>
                    <p>Trigger: {backupStatus.triggeredBy === 'cron' ? 'Otomatis (cron)' : 'Manual'}</p>
                    <p>Total: {backupStatus.totalRows} baris, durasi {(Number(backupStatus.duration) / 1000).toFixed(1)} detik</p>
                  </div>
                </div>
              ) : backupConfigured !== null ? (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
                  <p className="text-sm text-gray-600">Belum ada backup. Lakukan backup pertama kamu.</p>
                </div>
              ) : null}

              <div className="flex gap-2">
                <Button onClick={handleBackup} disabled={isBackingUp}>
                  {isBackingUp ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Memproses backup...
                    </>
                  ) : (
                    <>
                      <CloudUpload className="mr-2 h-4 w-4" />
                      Backup Sekarang
                    </>
                  )}
                </Button>
                <Button variant="outline" onClick={handleInitSheets} disabled={isInitializing}>
                  {isInitializing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    'Inisialisasi Tabs'
                  )}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* ============================================ */}
      {/* RESTORE DARI GOOGLE SHEETS                   */}
      {/* ============================================ */}
      <Card className="mb-8 border-orange-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-orange-700">
            <Download className="h-5 w-5" />
            Restore dari Google Sheets
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4">
            <p className="text-sm text-orange-800 font-medium mb-2">
              Pulihkan data dari backup Google Sheets
            </p>
            <p className="text-sm text-orange-700">
              Mengganti <strong>SEMUA</strong> data saat ini dengan data dari backup terakhir di Google Sheets.
              Jika terjadi error, data tidak akan berubah (rollback otomatis).
            </p>
            <p className="text-sm text-orange-600 mt-2 font-medium">
              Pastikan kamu sudah backup data terbaru sebelum restore!
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="restoreConfirmText" className="text-sm text-gray-700">
                Ketik <strong className="text-orange-700 font-mono">RESTORE DATA</strong> untuk mengaktifkan tombol:
              </Label>
              <Input
                id="restoreConfirmText"
                value={restoreConfirmText}
                onChange={(e) => setRestoreConfirmText(e.target.value)}
                placeholder="Ketik di sini..."
                className="mt-2 font-mono"
                disabled={isRestoring || backupConfigured === false}
              />
            </div>

            <Button
              variant="destructive"
              onClick={handleRestore}
              disabled={!isRestoreConfirmValid || isRestoring || backupConfigured === false}
              className="w-full"
            >
              {isRestoring ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Memproses restore...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Restore Data
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ============================================ */}
      {/* ISI SAMPLE DATA                              */}
      {/* ============================================ */}
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
            dan transaksi lengkap (Quotation &rarr; Sales Order &rarr; Delivery &rarr; Shipment &rarr; Invoice &rarr; Payment).
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

      {/* ============================================ */}
      {/* ZONA BERBAHAYA                               */}
      {/* ============================================ */}
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
