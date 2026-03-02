/**
 * Google Apps Script - Backup Bridge untuk Spareparts Sales
 *
 * CARA SETUP:
 * 1. Buat Google Spreadsheet baru
 * 2. Buka Extensions > Apps Script
 * 3. Hapus semua kode yang ada, paste seluruh kode ini
 * 4. Ganti SECRET_KEY di bawah dengan password rahasia kamu
 * 5. Klik Deploy > New deployment
 *    - Type: Web App
 *    - Execute as: Me
 *    - Who has access: Anyone
 * 6. Copy URL yang diberikan
 * 7. Masukkan URL dan SECRET_KEY ke environment variables di Vercel:
 *    - GOOGLE_SCRIPT_URL = URL dari step 6
 *    - BACKUP_SECRET = SECRET_KEY yang sama
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

    // Verify secret
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

/**
 * INIT: Buat semua sheet tabs
 */
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

  // Hapus sheet default "Sheet1" jika masih ada dan bukan bagian dari SHEET_NAMES
  const sheet1 = ss.getSheetByName('Sheet1');
  if (sheet1 && !SHEET_NAMES.includes('Sheet1') && ss.getSheets().length > 1) {
    ss.deleteSheet(sheet1);
  }

  return jsonResponse({ success: true, created: created, total: SHEET_NAMES.length });
}

/**
 * BACKUP: Tulis data ke sheet tab
 * Input: { table: "Item", headers: ["id","name",...], rows: [["1","Oli",...], ...] }
 */
function handleBackup(data) {
  if (!data.table || !data.headers) {
    return jsonResponse({ success: false, error: 'Missing table or headers' });
  }

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(data.table);

  // Auto-create sheet jika belum ada
  if (!sheet) {
    sheet = ss.insertSheet(data.table);
  }

  // Clear seluruh sheet
  sheet.clear();

  // Tulis headers di row 1
  const headers = data.headers;
  if (headers.length > 0) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);

    // Bold headers
    sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');

    // Freeze header row
    sheet.setFrozenRows(1);
  }

  // Tulis data rows
  const rows = data.rows || [];
  if (rows.length > 0) {
    sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
  }

  return jsonResponse({
    success: true,
    table: data.table,
    rowCount: rows.length
  });
}

/**
 * RESTORE: Baca data dari sheet tab
 * Input: { table: "Item" }
 * Output: { headers: [...], rows: [[...], ...] }
 */
function handleRestore(data) {
  if (!data.table) {
    return jsonResponse({ success: false, error: 'Missing table name' });
  }

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(data.table);

  if (!sheet) {
    return jsonResponse({
      success: true,
      table: data.table,
      headers: [],
      rows: [],
      rowCount: 0
    });
  }

  const lastRow = sheet.getLastRow();
  const lastCol = sheet.getLastColumn();

  if (lastRow === 0 || lastCol === 0) {
    return jsonResponse({
      success: true,
      table: data.table,
      headers: [],
      rows: [],
      rowCount: 0
    });
  }

  const allData = sheet.getRange(1, 1, lastRow, lastCol).getValues();
  const headers = allData[0].map(h => String(h));
  const rows = allData.slice(1).map(row => row.map(cell => {
    if (cell instanceof Date) {
      return cell.toISOString();
    }
    if (cell === null || cell === undefined) {
      return '';
    }
    return String(cell);
  }));

  return jsonResponse({
    success: true,
    table: data.table,
    headers: headers,
    rows: rows,
    rowCount: rows.length
  });
}

/**
 * STATUS: Baca backup log terakhir
 */
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

/**
 * LOG: Tulis entry ke _BackupLog
 * Input: { entry: { timestamp, triggeredBy, duration, totalRows, tables } }
 */
function handleLog(data) {
  if (!data.entry) {
    return jsonResponse({ success: false, error: 'Missing log entry' });
  }

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName('_BackupLog');

  if (!sheet) {
    sheet = ss.insertSheet('_BackupLog');
  }

  // Tulis headers jika sheet kosong
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

/**
 * Helper: Return JSON response
 */
function jsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
