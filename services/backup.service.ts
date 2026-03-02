import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'

// ============================================
// TYPES
// ============================================

export interface BackupResult {
  success: boolean
  timestamp: string
  duration: number
  tables: { name: string; rowCount: number }[]
  totalRows: number
  error?: string
}

export interface RestoreResult {
  success: boolean
  timestamp: string
  duration: number
  tables: { name: string; rowCount: number }[]
  totalRows: number
  error?: string
}

export interface BackupStatus {
  timestamp: string
  triggeredBy: string
  duration: string
  totalRows: string
  tables: string
}

// ============================================
// TABLE CONFIGURATION (FK-safe order)
// ============================================

interface TableConfig {
  prismaKey: string
  sheetName: string
}

// Order: parent tables first, child tables last
const TABLE_CONFIG: TableConfig[] = [
  { prismaKey: 'role', sheetName: 'Role' },
  { prismaKey: 'user', sheetName: 'User' },
  { prismaKey: 'taxMaster', sheetName: 'TaxMaster' },
  { prismaKey: 'taxHistory', sheetName: 'TaxHistory' },
  { prismaKey: 'customer', sheetName: 'Customer' },
  { prismaKey: 'item', sheetName: 'Item' },
  { prismaKey: 'unitConversion', sheetName: 'UnitConversion' },
  { prismaKey: 'unitPrice', sheetName: 'UnitPrice' },
  { prismaKey: 'location', sheetName: 'Location' },
  { prismaKey: 'batch', sheetName: 'Batch' },
  { prismaKey: 'stock', sheetName: 'Stock' },
  { prismaKey: 'priceMovement', sheetName: 'PriceMovement' },
  { prismaKey: 'salesQuotation', sheetName: 'SalesQuotation' },
  { prismaKey: 'salesQuotationItem', sheetName: 'SalesQuotationItem' },
  { prismaKey: 'salesOrder', sheetName: 'SalesOrder' },
  { prismaKey: 'salesOrderItem', sheetName: 'SalesOrderItem' },
  { prismaKey: 'deliveryOrder', sheetName: 'DeliveryOrder' },
  { prismaKey: 'deliveryOrderItem', sheetName: 'DeliveryOrderItem' },
  { prismaKey: 'shipment', sheetName: 'Shipment' },
  { prismaKey: 'invoice', sheetName: 'Invoice' },
  { prismaKey: 'invoiceItem', sheetName: 'InvoiceItem' },
  { prismaKey: 'payment', sheetName: 'Payment' },
  { prismaKey: 'return', sheetName: 'Return' },
  { prismaKey: 'returnItem', sheetName: 'ReturnItem' },
]

// ============================================
// FIELD TYPE METADATA
// ============================================

type FieldType = 'string' | 'int' | 'decimal' | 'boolean' | 'datetime' | 'json'

const FIELD_TYPES: Record<string, Record<string, FieldType>> = {
  role: {
    id: 'string', name: 'string', description: 'string',
    permissions: 'json', isSystem: 'boolean',
    createdAt: 'datetime', updatedAt: 'datetime',
  },
  user: {
    id: 'string', username: 'string', passwordHash: 'string',
    fullName: 'string', email: 'string', roleId: 'string',
    isActive: 'boolean', lastLoginAt: 'datetime',
    createdAt: 'datetime', updatedAt: 'datetime',
  },
  taxMaster: {
    id: 'string', taxCode: 'string', taxName: 'string',
    taxRate: 'decimal', taxType: 'string',
    isDefault: 'boolean', effectiveFrom: 'datetime', effectiveTo: 'datetime',
    isActive: 'boolean', createdAt: 'datetime', updatedAt: 'datetime',
  },
  taxHistory: {
    id: 'int', taxCode: 'string',
    oldRate: 'decimal', newRate: 'decimal',
    changedBy: 'string', changedAt: 'datetime', reason: 'string',
  },
  customer: {
    id: 'string', customerCode: 'string', customerName: 'string',
    customerType: 'string', phone: 'string', email: 'string',
    address: 'string', city: 'string', npwp: 'string',
    discountRate: 'decimal', creditLimit: 'decimal', creditTerm: 'int',
    isTaxable: 'boolean', isActive: 'boolean',
    createdAt: 'datetime', updatedAt: 'datetime',
  },
  item: {
    id: 'string', itemCode: 'string', itemName: 'string',
    category: 'string', brand: 'string', baseUnit: 'string',
    basePrice: 'decimal', sellingPrice: 'decimal', minStock: 'int',
    description: 'string', compatibleMotors: 'json',
    isTaxable: 'boolean', isActive: 'boolean',
    createdAt: 'datetime', updatedAt: 'datetime',
  },
  unitConversion: {
    id: 'int', itemCode: 'string', fromUnit: 'string', toUnit: 'string',
    conversionFactor: 'decimal', isActive: 'boolean', createdAt: 'datetime',
  },
  unitPrice: {
    id: 'int', itemCode: 'string', unit: 'string',
    buyingPrice: 'decimal', sellingPrice: 'decimal', minQty: 'int',
    isActive: 'boolean', createdAt: 'datetime', updatedAt: 'datetime',
  },
  location: {
    id: 'string', locationCode: 'string', locationName: 'string',
    warehouse: 'string', zone: 'string', description: 'string',
    isActive: 'boolean', createdAt: 'datetime', updatedAt: 'datetime',
  },
  batch: {
    id: 'string', batchNumber: 'string', itemCode: 'string',
    purchaseDate: 'datetime', purchasePrice: 'decimal', supplier: 'string',
    expiryDate: 'datetime', characteristics: 'json', notes: 'string',
    createdAt: 'datetime',
  },
  stock: {
    id: 'string', itemCode: 'string', locationCode: 'string', batchNumber: 'string',
    quantity: 'decimal', reservedQty: 'decimal', availableQty: 'decimal',
    lastUpdated: 'datetime',
  },
  priceMovement: {
    id: 'int', itemCode: 'string', unit: 'string', priceType: 'string',
    oldPrice: 'decimal', newPrice: 'decimal', changePercentage: 'decimal',
    reason: 'string', changedBy: 'string', changedAt: 'datetime',
  },
  salesQuotation: {
    id: 'string', sqNumber: 'string', sqDate: 'datetime', customerCode: 'string',
    validUntil: 'datetime', subtotal: 'decimal', discountAmount: 'decimal',
    taxAmount: 'decimal', grandTotal: 'decimal', notes: 'string',
    status: 'string', convertedToSo: 'boolean', soNumber: 'string',
    createdAt: 'datetime', updatedAt: 'datetime',
  },
  salesQuotationItem: {
    id: 'string', sqId: 'string', itemCode: 'string',
    quantity: 'decimal', unit: 'string', unitPrice: 'decimal',
    discountPercent: 'decimal', discountAmount: 'decimal', subtotal: 'decimal',
    notes: 'string',
  },
  salesOrder: {
    id: 'string', soNumber: 'string', soDate: 'datetime', customerCode: 'string',
    sqId: 'string', sqNumber: 'string', deliveryAddress: 'string',
    deliveryDate: 'datetime', subtotal: 'decimal', discountAmount: 'decimal',
    taxAmount: 'decimal', grandTotal: 'decimal', notes: 'string',
    status: 'string', createdAt: 'datetime', updatedAt: 'datetime',
  },
  salesOrderItem: {
    id: 'string', soId: 'string', itemCode: 'string',
    quantity: 'decimal', reservedQty: 'decimal', fulfilledQty: 'decimal',
    unit: 'string', unitPrice: 'decimal',
    discountPercent: 'decimal', discountAmount: 'decimal', subtotal: 'decimal',
    notes: 'string',
  },
  deliveryOrder: {
    id: 'string', doNumber: 'string', doDate: 'datetime',
    soId: 'string', soNumber: 'string', customerCode: 'string',
    pickerName: 'string', notes: 'string', status: 'string',
    pickedAt: 'datetime', createdAt: 'datetime', updatedAt: 'datetime',
  },
  deliveryOrderItem: {
    id: 'string', doId: 'string', soItemId: 'string', itemCode: 'string',
    orderedQty: 'decimal', pickedQty: 'decimal', unit: 'string',
    batchNumber: 'string', locationCode: 'string', notes: 'string',
  },
  shipment: {
    id: 'string', sjNumber: 'string', sjDate: 'datetime',
    doId: 'string', doNumber: 'string', soId: 'string', soNumber: 'string',
    customerCode: 'string', driverName: 'string', vehicleNumber: 'string',
    deliveryAddress: 'string', recipient: 'string', notes: 'string',
    status: 'string', deliveredAt: 'datetime',
    createdAt: 'datetime', updatedAt: 'datetime',
  },
  invoice: {
    id: 'string', invNumber: 'string', invDate: 'datetime', dueDate: 'datetime',
    soId: 'string', soNumber: 'string', customerCode: 'string',
    subtotal: 'decimal', discountAmount: 'decimal', taxAmount: 'decimal',
    grandTotal: 'decimal', hpp: 'decimal', profit: 'decimal', profitMargin: 'decimal',
    paidAmount: 'decimal', remainingAmount: 'decimal',
    notes: 'string', status: 'string',
    createdAt: 'datetime', updatedAt: 'datetime',
  },
  invoiceItem: {
    id: 'string', invId: 'string', itemCode: 'string',
    quantity: 'decimal', unit: 'string', unitPrice: 'decimal',
    discountPercent: 'decimal', discountAmount: 'decimal', subtotal: 'decimal',
    hpp: 'decimal', profit: 'decimal',
  },
  payment: {
    id: 'string', paymentNumber: 'string', paymentDate: 'datetime',
    invoiceId: 'string', invoiceNumber: 'string', customerCode: 'string',
    amount: 'decimal', paymentMethod: 'string', referenceNumber: 'string',
    notes: 'string', createdAt: 'datetime', updatedAt: 'datetime',
  },
  return: {
    id: 'string', returnNumber: 'string', returnDate: 'datetime',
    soId: 'string', soNumber: 'string', customerCode: 'string',
    status: 'string', reason: 'string',
    createdAt: 'datetime', updatedAt: 'datetime',
  },
  returnItem: {
    id: 'string', returnId: 'string', itemCode: 'string',
    quantity: 'decimal', unit: 'string', condition: 'string', notes: 'string',
  },
}

// Nullable fields per model (fields that can be null in the schema)
const NULLABLE_FIELDS: Record<string, string[]> = {
  role: ['description'],
  user: ['email', 'lastLoginAt'],
  taxMaster: ['effectiveTo'],
  taxHistory: ['reason'],
  customer: ['phone', 'email', 'address', 'city', 'npwp'],
  item: ['description', 'compatibleMotors'],
  location: ['zone', 'description'],
  batch: ['expiryDate', 'characteristics', 'notes'],
  stock: [],
  priceMovement: ['reason'],
  salesQuotation: ['notes', 'soNumber'],
  salesQuotationItem: ['notes'],
  salesOrder: ['sqId', 'sqNumber', 'deliveryAddress', 'deliveryDate', 'notes'],
  salesOrderItem: ['notes'],
  deliveryOrder: ['pickerName', 'notes', 'pickedAt'],
  deliveryOrderItem: ['notes'],
  shipment: ['driverName', 'vehicleNumber', 'recipient', 'notes', 'deliveredAt'],
  invoice: ['notes'],
  invoiceItem: [],
  payment: ['referenceNumber', 'notes'],
  return: ['soId', 'soNumber', 'reason'],
  returnItem: ['condition', 'notes'],
}

// Models with autoincrement Int ID
const AUTO_INCREMENT_MODELS = ['unitConversion', 'unitPrice', 'taxHistory', 'priceMovement']

// DB table names for sequence reset (@@map values)
const DB_TABLE_NAMES: Record<string, string> = {
  unitConversion: 'unit_conversions',
  unitPrice: 'unit_prices',
  taxHistory: 'tax_history',
  priceMovement: 'price_movements',
}

// ============================================
// HELPERS
// ============================================

function getScriptUrl(): string {
  const url = process.env.GOOGLE_SCRIPT_URL
  if (!url) throw new Error('GOOGLE_SCRIPT_URL belum dikonfigurasi')
  return url
}

function getBackupSecret(): string {
  const secret = process.env.BACKUP_SECRET
  if (!secret) throw new Error('BACKUP_SECRET belum dikonfigurasi')
  return secret
}

export function isBackupConfigured(): boolean {
  return !!(process.env.GOOGLE_SCRIPT_URL && process.env.BACKUP_SECRET)
}

async function callAppsScript(payload: Record<string, unknown>): Promise<Record<string, unknown>> {
  const url = getScriptUrl()
  const secret = getBackupSecret()

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...payload, secret }),
  })

  // Google Apps Script may redirect (302) — fetch follows automatically
  const text = await response.text()

  try {
    return JSON.parse(text)
  } catch {
    throw new Error(`Respons dari Google Apps Script tidak valid: ${text.substring(0, 200)}`)
  }
}

function serializeValue(value: unknown): string {
  if (value === null || value === undefined) return ''
  if (value instanceof Date) return value.toISOString()
  // Prisma Decimal
  if (typeof value === 'object' && value !== null && 'toFixed' in value) {
    return String(value)
  }
  if (typeof value === 'object') return JSON.stringify(value)
  if (typeof value === 'boolean') return value.toString()
  return String(value)
}

function deserializeValue(
  prismaKey: string,
  fieldName: string,
  rawValue: string
): unknown {
  const fieldType = FIELD_TYPES[prismaKey]?.[fieldName]
  const isNullable = NULLABLE_FIELDS[prismaKey]?.includes(fieldName) ?? false

  // Empty string = null for nullable fields, or default for required fields
  if (rawValue === '' || rawValue === 'null' || rawValue === 'undefined') {
    if (isNullable) return null
    switch (fieldType) {
      case 'string': return ''
      case 'int': return 0
      case 'decimal': return new Prisma.Decimal(0)
      case 'boolean': return false
      case 'datetime': return new Date()
      case 'json': return {}
      default: return ''
    }
  }

  switch (fieldType) {
    case 'string':
      return rawValue
    case 'int':
      return parseInt(rawValue, 10)
    case 'decimal':
      return new Prisma.Decimal(rawValue)
    case 'boolean':
      return rawValue === 'true'
    case 'datetime':
      return new Date(rawValue)
    case 'json':
      try {
        return JSON.parse(rawValue)
      } catch {
        return rawValue
      }
    default:
      return rawValue
  }
}

function getHeadersForModel(prismaKey: string): string[] {
  return Object.keys(FIELD_TYPES[prismaKey] || {})
}

// ============================================
// MAIN FUNCTIONS
// ============================================

/**
 * Initialize Google Sheet tabs (call once during setup)
 */
export async function initializeSheets(): Promise<{ created: string[]; total: number }> {
  const result = await callAppsScript({ action: 'init' })
  if (!result.success) {
    throw new Error(String(result.error || 'Gagal inisialisasi sheet tabs'))
  }
  return {
    created: (result.created as string[]) || [],
    total: (result.total as number) || 0,
  }
}

/**
 * Perform full backup of all 24 tables to Google Sheets
 */
export async function performBackup(triggeredBy: string = 'manual'): Promise<BackupResult> {
  const startTime = Date.now()
  const tableSummary: { name: string; rowCount: number }[] = []

  try {
    // Backup each table
    for (const config of TABLE_CONFIG) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const records = await (prisma as any)[config.prismaKey].findMany()

      const headers = getHeadersForModel(config.prismaKey)
      const rows = records.map((record: Record<string, unknown>) =>
        headers.map((key) => serializeValue(record[key]))
      )

      const result = await callAppsScript({
        action: 'backup',
        table: config.sheetName,
        headers,
        rows,
      })

      if (!result.success) {
        throw new Error(`Gagal backup tabel ${config.sheetName}: ${result.error}`)
      }

      tableSummary.push({ name: config.sheetName, rowCount: rows.length })
    }

    const duration = Date.now() - startTime
    const totalRows = tableSummary.reduce((sum, t) => sum + t.rowCount, 0)

    // Write backup log
    await callAppsScript({
      action: 'log',
      entry: {
        timestamp: new Date().toISOString(),
        triggeredBy,
        duration,
        totalRows,
        tables: JSON.stringify(tableSummary),
      },
    })

    return {
      success: true,
      timestamp: new Date().toISOString(),
      duration,
      tables: tableSummary,
      totalRows,
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return {
      success: false,
      timestamp: new Date().toISOString(),
      duration: Date.now() - startTime,
      tables: tableSummary,
      totalRows: tableSummary.reduce((sum, t) => sum + t.rowCount, 0),
      error: message,
    }
  }
}

/**
 * Restore all data from Google Sheets backup
 */
export async function performRestore(): Promise<RestoreResult> {
  const startTime = Date.now()
  const tableSummary: { name: string; rowCount: number }[] = []

  try {
    // Step 1: Read all data from sheets first (before any DB changes)
    const allTableData: Map<string, { headers: string[]; rows: string[][] }> = new Map()

    for (const config of TABLE_CONFIG) {
      const result = await callAppsScript({
        action: 'restore',
        table: config.sheetName,
      })

      if (!result.success) {
        throw new Error(`Gagal membaca tabel ${config.sheetName}: ${result.error}`)
      }

      allTableData.set(config.prismaKey, {
        headers: (result.headers as string[]) || [],
        rows: (result.rows as string[][]) || [],
      })
    }

    // Step 2: Delete all + insert all in a transaction
    await prisma.$transaction(
      async (tx) => {
        // Delete in reverse FK order
        const reversed = [...TABLE_CONFIG].reverse()
        for (const config of reversed) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (tx as any)[config.prismaKey].deleteMany()
        }

        // Insert in FK order
        for (const config of TABLE_CONFIG) {
          const tableData = allTableData.get(config.prismaKey)
          if (!tableData || tableData.rows.length === 0) {
            tableSummary.push({ name: config.sheetName, rowCount: 0 })
            continue
          }

          const { headers, rows } = tableData
          const records = rows.map((row) => {
            const record: Record<string, unknown> = {}
            for (let i = 0; i < headers.length; i++) {
              const key = headers[i]
              const rawValue = row[i] ?? ''
              record[key] = deserializeValue(config.prismaKey, key, rawValue)
            }
            return record
          })

          if (AUTO_INCREMENT_MODELS.includes(config.prismaKey)) {
            // Auto-increment models: insert one by one to preserve IDs
            for (const record of records) {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              await (tx as any)[config.prismaKey].create({ data: record })
            }
          } else {
            // UUID models: batch insert
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            await (tx as any)[config.prismaKey].createMany({
              data: records,
              skipDuplicates: true,
            })
          }

          tableSummary.push({ name: config.sheetName, rowCount: records.length })
        }
      },
      {
        maxWait: 60000,
        timeout: 120000,
      }
    )

    // Step 3: Reset auto-increment sequences
    await resetAutoIncrementSequences()

    const duration = Date.now() - startTime
    const totalRows = tableSummary.reduce((sum, t) => sum + t.rowCount, 0)

    return {
      success: true,
      timestamp: new Date().toISOString(),
      duration,
      tables: tableSummary,
      totalRows,
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return {
      success: false,
      timestamp: new Date().toISOString(),
      duration: Date.now() - startTime,
      tables: tableSummary,
      totalRows: tableSummary.reduce((sum, t) => sum + t.rowCount, 0),
      error: message,
    }
  }
}

/**
 * Get last backup status from _BackupLog sheet
 */
export async function getBackupStatus(): Promise<BackupStatus | null> {
  try {
    const result = await callAppsScript({ action: 'status' })
    if (!result.success || !result.status) return null
    return result.status as BackupStatus
  } catch {
    return null
  }
}

/**
 * Reset PostgreSQL auto-increment sequences after restore
 */
async function resetAutoIncrementSequences(): Promise<void> {
  for (const model of AUTO_INCREMENT_MODELS) {
    const tableName = DB_TABLE_NAMES[model]
    if (!tableName) continue

    await prisma.$executeRawUnsafe(
      `SELECT setval(pg_get_serial_sequence('${tableName}', 'id'), COALESCE((SELECT MAX(id) FROM "${tableName}"), 0) + 1, false)`
    )
  }
}
