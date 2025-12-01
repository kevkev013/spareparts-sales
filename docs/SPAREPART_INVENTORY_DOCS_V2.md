# 📋 Dokumentasi Sistem Inventory Sparepart Motor
## Version 2.0

---

## 1. Overview

### 1.1 Tentang Aplikasi
Aplikasi web fullstack untuk mengelola inventory, proses penjualan end-to-end, pembayaran, retur, dan dokumen bisnis untuk usaha sparepart motor.

### 1.2 Target User
| Role | Akses |
|------|-------|
| **Admin/Owner** | Full akses semua fitur |
| **Staff Sales** | Quotation, Sales Order, Payment, lihat stok |
| **Staff Gudang** | Delivery Order, Shipment, Return, kelola stok |

### 1.3 Tujuan Bisnis
- Mencatat dan mengelola stok sparepart dengan tracking batch & lokasi
- Mengelola proses penjualan dari quotation sampai invoice
- Tracking pembayaran dan piutang customer
- Mengelola retur barang dari customer
- Tracking HPP dan profit margin
- Memantau pergerakan harga (price movement)
- Dokumentasi lengkap untuk setiap transaksi
- Konfigurasi pajak yang fleksibel

---

## 2. Business Flow

### 2.1 Sales Process Flow
```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                              SALES PROCESS FLOW                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘

  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
  │    Sales     │    │    Sales     │    │   Delivery   │    │   Shipment   │
  │  Quotation   │───▶│    Order     │───▶│    Order     │───▶│ (Surat Jalan)│
  │   (SQ)       │    │    (SO)      │    │    (DO)      │    │    (SJ)      │
  └──────────────┘    └──────────────┘    └──────────────┘    └──────────────┘
        │                   │                    │                    │
        ▼                   ▼                    ▼                    ▼
   Penawaran ke      Customer OK,         Perintah ambil       Barang dikirim
   customer          confirm order        barang dari          ke customer
                     + reserve stok       gudang (batch &
                                          location)
                                                                     │
                                                                     ▼
                                                              ┌──────────────┐
                                                              │   Invoice    │
                                                              │    (INV)     │
                                                              └──────────────┘
                                                                     │
                                                                     ▼
                                                              ┌──────────────┐
                                                              │   Payment    │
                                                              │   Receipt    │
                                                              └──────────────┘
```

### 2.2 Return Process Flow
```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                              RETURN PROCESS FLOW                                     │
└─────────────────────────────────────────────────────────────────────────────────────┘

  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
  │   Return     │    │   Return     │    │    Stock     │    │Credit Note / │
  │   Request    │───▶│   Receipt    │───▶│   Update     │───▶│   Refund     │
  │   (RR)       │    │   (RCV)      │    │              │    │    (CN)      │
  └──────────────┘    └──────────────┘    └──────────────┘    └──────────────┘
        │                   │                    │                    │
        ▼                   ▼                    ▼                    ▼
   Customer minta     Barang diterima      Stok masuk          Potong piutang
   return             & di-inspect         kembali             atau refund
                                           (jika layak)
```

### 2.3 Inventory Flow
```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                              INVENTORY FLOW                                          │
└─────────────────────────────────────────────────────────────────────────────────────┘

                              ┌──────────────┐
           ┌─────────────────▶│    Stock     │◀─────────────────┐
           │                  │   Available  │                  │
           │                  └──────────────┘                  │
           │                         │                          │
    ┌──────┴───────┐                 │                   ┌──────┴───────┐
    │   Goods      │                 │                   │    Return    │
    │   Receipt    │                 ▼                   │    Receipt   │
    │  (Pembelian) │          ┌──────────────┐          │              │
    └──────────────┘          │   Delivery   │          └──────────────┘
                              │    Order     │
                              └──────────────┘
                                     │
                                     ▼
                               Stok berkurang
                              (per batch/loc)
```

---

## 3. Modul & Fitur

### 3.1 Master Data

#### 3.1.1 Master Sparepart (Item)
| Field | Tipe | Keterangan |
|-------|------|------------|
| item_code | String | Kode unik barang (auto/manual) |
| item_name | String | Nama sparepart |
| category | String | Kategori (oli, filter, kampas, bearing, dll) |
| brand | String | Merk (Honda, Yamaha, Suzuki, Aftermarket, dll) |
| base_unit | String | Satuan dasar (pcs, liter, meter) |
| base_price | Decimal | Harga beli dasar (untuk HPP) |
| selling_price | Decimal | Harga jual (per base_unit) |
| min_stock | Integer | Stok minimum (alert) |
| description | Text | Deskripsi/spesifikasi |
| compatible_motors | Array | Motor yang cocok |
| is_taxable | Boolean | Kena pajak atau tidak |
| is_active | Boolean | Status aktif/tidak |
| created_at | DateTime | Tanggal dibuat |
| updated_at | DateTime | Tanggal update |

#### 3.1.2 Unit Conversion (Konversi Satuan)
| Field | Tipe | Keterangan |
|-------|------|------------|
| id | Integer | Primary key |
| item_code | String | FK ke item |
| from_unit | String | Satuan asal (box, lusin, pack) |
| to_unit | String | Satuan tujuan (biasanya base_unit: pcs) |
| conversion_factor | Decimal | Faktor konversi |
| is_active | Boolean | Status aktif |

**Contoh Data:**
| item_code | from_unit | to_unit | conversion_factor |
|-----------|-----------|---------|-------------------|
| SPR-0001 | box | pcs | 12 |
| SPR-0001 | lusin | pcs | 12 |
| SPR-0001 | pack | pcs | 6 |
| SPR-0002 | galon | liter | 5 |
| SPR-0003 | set | pcs | 4 |

**Use Case:**
- Beli: 2 box (otomatis +24 pcs ke stok)
- Jual: bisa pilih per pcs atau per box
- Harga bisa berbeda per satuan (harga box bisa lebih murah)

#### 3.1.3 Unit Price (Harga per Satuan)
| Field | Tipe | Keterangan |
|-------|------|------------|
| id | Integer | Primary key |
| item_code | String | FK ke item |
| unit | String | Satuan |
| buying_price | Decimal | Harga beli per satuan ini |
| selling_price | Decimal | Harga jual per satuan ini |
| min_qty | Integer | Minimal qty untuk harga ini (untuk grosir) |
| is_active | Boolean | Status aktif |

**Contoh:**
| item_code | unit | selling_price | min_qty |
|-----------|------|---------------|---------|
| SPR-0001 | pcs | 15.000 | 1 |
| SPR-0001 | pcs | 13.000 | 50 | ← harga grosir
| SPR-0001 | box | 150.000 | 1 | ← harga per box (lebih murah dari 12 x 15rb)

#### 3.1.4 Master Customer
| Field | Tipe | Keterangan |
|-------|------|------------|
| customer_code | String | Kode customer |
| customer_name | String | Nama customer/bengkel |
| customer_type | Enum | retail / wholesale / bengkel |
| phone | String | No telepon |
| email | String | Email |
| address | Text | Alamat lengkap |
| city | String | Kota |
| npwp | String | Nomor NPWP (untuk faktur pajak) |
| discount_rate | Decimal | Default diskon (%) |
| credit_limit | Decimal | Limit piutang |
| credit_term | Integer | Tenor kredit (hari), default 0 = cash |
| is_taxable | Boolean | Kena pajak atau tidak |
| is_active | Boolean | Status aktif |

#### 3.1.5 Master Storage Location
| Field | Tipe | Keterangan |
|-------|------|------------|
| location_code | String | Kode lokasi (GD-A1, GD-B2, dll) |
| location_name | String | Nama lokasi |
| warehouse | String | Nama gudang |
| zone | String | Zona (receiving, storage, shipping) |
| description | Text | Keterangan |
| is_active | Boolean | Status aktif |

#### 3.1.6 Master Batch
| Field | Tipe | Keterangan |
|-------|------|------------|
| batch_number | String | Nomor batch |
| item_code | String | FK ke item |
| purchase_date | Date | Tanggal pembelian |
| purchase_price | Decimal | Harga beli batch ini (per base_unit) |
| supplier | String | Nama supplier |
| expiry_date | Date | Tanggal kadaluarsa (jika ada) |
| characteristics | JSON | Karakteristik khusus batch |
| notes | Text | Catatan tambahan |
| created_at | DateTime | Tanggal dibuat |

**Contoh Characteristics (JSON):**
```json
{
  "color": "black",
  "grade": "A",
  "origin": "Thailand",
  "production_year": "2024",
  "warranty_months": 6
}
```

#### 3.1.7 Stock per Location & Batch
| Field | Tipe | Keterangan |
|-------|------|------------|
| id | Integer | Primary key |
| item_code | String | FK ke item |
| location_code | String | FK ke location |
| batch_number | String | FK ke batch |
| quantity | Decimal | Jumlah stok (dalam base_unit) |
| reserved_qty | Decimal | Qty yang sudah di-reserve (SO belum DO) |
| available_qty | Decimal | Qty tersedia (quantity - reserved) |
| last_updated | DateTime | Terakhir update |

---

### 3.2 Tax Configuration (Konfigurasi Pajak)

#### 3.2.1 Tax Master
| Field | Tipe | Keterangan |
|-------|------|------------|
| tax_code | String | Kode pajak (PPN, PPH23, dll) |
| tax_name | String | Nama pajak |
| tax_rate | Decimal | Rate/tarif (%) |
| tax_type | Enum | inclusive / exclusive |
| is_default | Boolean | Default untuk transaksi baru |
| effective_from | Date | Berlaku mulai tanggal |
| effective_to | Date | Berlaku sampai tanggal (null = masih aktif) |
| is_active | Boolean | Status aktif |
| created_at | DateTime | Tanggal dibuat |
| updated_at | DateTime | Tanggal update |

**Contoh Data:**
| tax_code | tax_name | tax_rate | effective_from | effective_to |
|----------|----------|----------|----------------|--------------|
| PPN-11 | PPN 11% | 11.00 | 2022-04-01 | 2024-12-31 |
| PPN-12 | PPN 12% | 12.00 | 2025-01-01 | null |
| NON-TAX | Non-Taxable | 0.00 | 2020-01-01 | null |

**Note:** Sistem akan otomatis menggunakan tax rate yang berlaku berdasarkan tanggal transaksi.

#### 3.2.2 Tax History (Audit Trail)
| Field | Tipe | Keterangan |
|-------|------|------------|
| id | Integer | Primary key |
| tax_code | String | FK ke tax master |
| old_rate | Decimal | Rate lama |
| new_rate | Decimal | Rate baru |
| changed_by | String | User yang mengubah |
| changed_at | DateTime | Waktu perubahan |
| reason | String | Alasan perubahan |

---

### 3.3 Price Management

#### 3.3.1 HPP (Harga Pokok Penjualan)
Metode perhitungan HPP yang didukung:

| Metode | Keterangan |
|--------|------------|
| **FIFO** | First In First Out - stok lama dijual duluan |
| **Average** | Rata-rata tertimbang harga beli |
| **Specific** | Berdasarkan batch yang dipilih |

**HPP Calculation Table:**
| Field | Tipe | Keterangan |
|-------|------|------------|
| item_code | String | FK ke item |
| method | Enum | FIFO / Average / Specific |
| current_hpp | Decimal | HPP saat ini (per base_unit) |
| last_calculated | DateTime | Terakhir dihitung |

#### 3.3.2 Price Movement (Riwayat Harga)
| Field | Tipe | Keterangan |
|-------|------|------------|
| id | Integer | Primary key |
| item_code | String | FK ke item |
| unit | String | Satuan |
| price_type | Enum | buying / selling |
| old_price | Decimal | Harga lama |
| new_price | Decimal | Harga baru |
| change_percentage | Decimal | Persentase perubahan |
| reason | String | Alasan perubahan |
| changed_by | String | User yang mengubah |
| changed_at | DateTime | Waktu perubahan |

---

### 3.4 Sales Documents

#### 3.4.1 Sales Quotation (SQ)
Penawaran harga ke customer. Belum mengurangi stok.

**Header:**
| Field | Tipe | Keterangan |
|-------|------|------------|
| sq_number | String | Nomor SQ (auto: SQ-YYYYMM-0001) |
| sq_date | Date | Tanggal quotation |
| valid_until | Date | Berlaku sampai |
| customer_code | String | FK ke customer |
| customer_name | String | Nama customer |
| customer_address | Text | Alamat customer |
| subtotal | Decimal | Total sebelum diskon/pajak |
| discount_type | Enum | percent / amount |
| discount_value | Decimal | Nilai diskon |
| discount_amount | Decimal | Jumlah diskon (calculated) |
| tax_code | String | FK ke tax master |
| tax_rate | Decimal | Rate pajak saat transaksi |
| tax_amount | Decimal | Jumlah pajak |
| grand_total | Decimal | Total akhir |
| notes | Text | Catatan |
| terms_conditions | Text | Syarat & ketentuan |
| status | Enum | draft / sent / accepted / rejected / expired |
| created_by | String | Dibuat oleh |
| created_at | DateTime | Tanggal dibuat |

**Detail:**
| Field | Tipe | Keterangan |
|-------|------|------------|
| sq_number | String | FK ke header |
| line_number | Integer | Nomor baris |
| item_code | String | FK ke item |
| item_name | String | Nama item |
| quantity | Decimal | Jumlah |
| unit | String | Satuan yang dipilih |
| unit_price | Decimal | Harga per satuan |
| discount_percent | Decimal | Diskon per baris (%) |
| line_total | Decimal | Total baris |

#### 3.4.2 Sales Order (SO)
Order yang sudah dikonfirmasi customer. Stok di-reserve.

**Header:**
| Field | Tipe | Keterangan |
|-------|------|------------|
| so_number | String | Nomor SO (auto: SO-YYYYMM-0001) |
| so_date | Date | Tanggal order |
| sq_number | String | Referensi SQ (nullable) |
| customer_code | String | FK ke customer |
| customer_name | String | Nama customer |
| shipping_address | Text | Alamat kirim |
| expected_delivery | Date | Estimasi pengiriman |
| subtotal | Decimal | Total sebelum diskon/pajak |
| discount_type | Enum | percent / amount |
| discount_value | Decimal | Nilai diskon |
| discount_amount | Decimal | Jumlah diskon |
| tax_code | String | FK ke tax master |
| tax_rate | Decimal | Rate pajak |
| tax_amount | Decimal | Jumlah pajak |
| grand_total | Decimal | Total akhir |
| notes | Text | Catatan |
| status | Enum | draft / confirmed / partial_delivered / delivered / cancelled |
| created_by | String | Dibuat oleh |
| created_at | DateTime | Tanggal dibuat |

**Detail:**
| Field | Tipe | Keterangan |
|-------|------|------------|
| so_number | String | FK ke header |
| line_number | Integer | Nomor baris |
| item_code | String | FK ke item |
| item_name | String | Nama item |
| quantity | Decimal | Jumlah order |
| unit | String | Satuan |
| base_qty | Decimal | Qty dalam base_unit (untuk stok) |
| delivered_qty | Decimal | Jumlah sudah dikirim (base_unit) |
| remaining_qty | Decimal | Sisa belum kirim (base_unit) |
| unit_price | Decimal | Harga satuan |
| discount_percent | Decimal | Diskon (%) |
| line_total | Decimal | Total baris |

#### 3.4.3 Delivery Order (DO)
Perintah pengambilan barang dari gudang.

**Header:**
| Field | Tipe | Keterangan |
|-------|------|------------|
| do_number | String | Nomor DO (auto: DO-YYYYMM-0001) |
| do_date | Date | Tanggal DO |
| so_number | String | FK ke Sales Order |
| customer_code | String | FK ke customer |
| customer_name | String | Nama customer |
| notes | Text | Catatan |
| status | Enum | draft / picking / picked / shipped / cancelled |
| picked_by | String | Staff yang mengambil barang |
| picked_at | DateTime | Waktu selesai picking |
| created_by | String | Dibuat oleh |
| created_at | DateTime | Tanggal dibuat |

**Detail:**
| Field | Tipe | Keterangan |
|-------|------|------------|
| do_number | String | FK ke header |
| line_number | Integer | Nomor baris |
| item_code | String | FK ke item |
| item_name | String | Nama item |
| quantity | Decimal | Jumlah yang diambil (base_unit) |
| unit | String | Base unit |
| location_code | String | Lokasi pengambilan |
| batch_number | String | Batch yang diambil |
| notes | Text | Catatan per baris |

#### 3.4.4 Shipment / Surat Jalan (SJ)
Dokumen pengiriman barang ke customer.

**Header:**
| Field | Tipe | Keterangan |
|-------|------|------------|
| sj_number | String | Nomor SJ (auto: SJ-YYYYMM-0001) |
| sj_date | Date | Tanggal surat jalan |
| do_number | String | FK ke Delivery Order |
| so_number | String | FK ke Sales Order |
| customer_code | String | FK ke customer |
| customer_name | String | Nama customer |
| shipping_address | Text | Alamat tujuan |
| courier_name | String | Nama kurir/pengirim |
| courier_phone | String | No HP kurir |
| vehicle_number | String | No kendaraan |
| notes | Text | Catatan |
| status | Enum | draft / in_transit / delivered / partial_returned / returned |
| shipped_at | DateTime | Waktu berangkat |
| delivered_at | DateTime | Waktu sampai |
| received_by | String | Nama penerima |
| receiver_phone | String | No HP penerima |
| proof_of_delivery | String | URL foto bukti terima (optional) |
| created_by | String | Dibuat oleh |
| created_at | DateTime | Tanggal dibuat |

**Detail:**
| Field | Tipe | Keterangan |
|-------|------|------------|
| sj_number | String | FK ke header |
| line_number | Integer | Nomor baris |
| item_code | String | FK ke item |
| item_name | String | Nama item |
| quantity | Decimal | Jumlah yang dikirim |
| unit | String | Satuan |
| batch_number | String | Nomor batch |
| notes | Text | Catatan |

#### 3.4.5 Invoice (INV)
Tagihan ke customer.

**Header:**
| Field | Tipe | Keterangan |
|-------|------|------------|
| inv_number | String | Nomor Invoice (auto: INV-YYYYMM-0001) |
| inv_date | Date | Tanggal invoice |
| due_date | Date | Jatuh tempo |
| so_number | String | FK ke Sales Order |
| sj_number | String | FK ke Surat Jalan |
| customer_code | String | FK ke customer |
| customer_name | String | Nama customer |
| customer_npwp | String | NPWP customer |
| billing_address | Text | Alamat tagihan |
| subtotal | Decimal | Total sebelum diskon/pajak |
| discount_amount | Decimal | Jumlah diskon |
| tax_code | String | FK ke tax master |
| tax_rate | Decimal | Rate pajak |
| tax_amount | Decimal | Jumlah pajak |
| grand_total | Decimal | Total akhir |
| paid_amount | Decimal | Jumlah sudah dibayar |
| remaining_amount | Decimal | Sisa tagihan |
| notes | Text | Catatan |
| status | Enum | draft / sent / partial_paid / paid / overdue / cancelled |
| created_by | String | Dibuat oleh |
| created_at | DateTime | Tanggal dibuat |

**Detail:**
| Field | Tipe | Keterangan |
|-------|------|------------|
| inv_number | String | FK ke header |
| line_number | Integer | Nomor baris |
| item_code | String | FK ke item |
| item_name | String | Nama item |
| quantity | Decimal | Jumlah |
| unit | String | Satuan |
| unit_price | Decimal | Harga satuan |
| hpp | Decimal | HPP per unit (base_unit) |
| discount_percent | Decimal | Diskon (%) |
| line_total | Decimal | Total baris |
| profit | Decimal | Profit (line_total - (hpp * base_qty)) |

---

### 3.5 Payment (Pembayaran)

#### 3.5.1 Payment Receipt
| Field | Tipe | Keterangan |
|-------|------|------------|
| payment_number | String | Nomor pembayaran (auto: PAY-YYYYMM-0001) |
| payment_date | Date | Tanggal pembayaran |
| customer_code | String | FK ke customer |
| customer_name | String | Nama customer |
| payment_method | Enum | cash / transfer / giro / card / other |
| bank_name | String | Nama bank (jika transfer/giro) |
| bank_account | String | No rekening |
| reference_number | String | No referensi (no transfer/no giro) |
| giro_due_date | Date | Jatuh tempo giro (jika giro) |
| total_amount | Decimal | Total pembayaran |
| notes | Text | Catatan |
| status | Enum | draft / confirmed / bounced / cancelled |
| confirmed_by | String | Dikonfirmasi oleh |
| confirmed_at | DateTime | Waktu konfirmasi |
| created_by | String | Dibuat oleh |
| created_at | DateTime | Tanggal dibuat |

#### 3.5.2 Payment Allocation (Alokasi ke Invoice)
| Field | Tipe | Keterangan |
|-------|------|------------|
| id | Integer | Primary key |
| payment_number | String | FK ke payment |
| inv_number | String | FK ke invoice |
| allocated_amount | Decimal | Jumlah yang dialokasikan |
| created_at | DateTime | Tanggal dibuat |

**Note:** 1 Payment bisa dialokasikan ke multiple invoice, dan 1 invoice bisa dibayar dengan multiple payment.

---

### 3.6 Return (Retur Barang)

#### 3.6.1 Return Request (RR)
Permintaan retur dari customer.

**Header:**
| Field | Tipe | Keterangan |
|-------|------|------------|
| rr_number | String | Nomor RR (auto: RR-YYYYMM-0001) |
| rr_date | Date | Tanggal request |
| inv_number | String | FK ke Invoice |
| sj_number | String | FK ke Surat Jalan |
| customer_code | String | FK ke customer |
| customer_name | String | Nama customer |
| return_reason | Enum | defect / wrong_item / damaged / other |
| reason_detail | Text | Detail alasan |
| total_amount | Decimal | Total nilai retur |
| notes | Text | Catatan |
| status | Enum | draft / approved / rejected / received / completed / cancelled |
| approved_by | String | Disetujui oleh |
| approved_at | DateTime | Waktu approval |
| created_by | String | Dibuat oleh |
| created_at | DateTime | Tanggal dibuat |

**Detail:**
| Field | Tipe | Keterangan |
|-------|------|------------|
| rr_number | String | FK ke header |
| line_number | Integer | Nomor baris |
| item_code | String | FK ke item |
| item_name | String | Nama item |
| quantity | Decimal | Jumlah retur |
| unit | String | Satuan |
| unit_price | Decimal | Harga satuan (dari invoice) |
| line_total | Decimal | Total baris |
| return_reason | Enum | defect / wrong_item / damaged / other |
| condition | Enum | good / damaged / unusable |
| notes | Text | Catatan per item |

#### 3.6.2 Return Receipt (RCV)
Penerimaan barang retur di gudang.

**Header:**
| Field | Tipe | Keterangan |
|-------|------|------------|
| rcv_number | String | Nomor RCV (auto: RCV-YYYYMM-0001) |
| rcv_date | Date | Tanggal terima |
| rr_number | String | FK ke Return Request |
| customer_code | String | FK ke customer |
| received_by | String | Diterima oleh |
| inspection_notes | Text | Catatan inspeksi |
| status | Enum | draft / inspected / processed / cancelled |
| created_by | String | Dibuat oleh |
| created_at | DateTime | Tanggal dibuat |

**Detail:**
| Field | Tipe | Keterangan |
|-------|------|------------|
| rcv_number | String | FK ke header |
| line_number | Integer | Nomor baris |
| item_code | String | FK ke item |
| item_name | String | Nama item |
| quantity | Decimal | Jumlah diterima |
| unit | String | Satuan |
| actual_condition | Enum | good / damaged / unusable |
| action | Enum | restock / dispose / repair |
| location_code | String | Lokasi penyimpanan (jika restock) |
| batch_number | String | Batch (jika restock) |
| notes | Text | Catatan |

#### 3.6.3 Credit Note (CN)
Potongan piutang / refund ke customer.

**Header:**
| Field | Tipe | Keterangan |
|-------|------|------------|
| cn_number | String | Nomor CN (auto: CN-YYYYMM-0001) |
| cn_date | Date | Tanggal credit note |
| rr_number | String | FK ke Return Request |
| inv_number | String | FK ke Invoice original |
| customer_code | String | FK ke customer |
| customer_name | String | Nama customer |
| subtotal | Decimal | Total sebelum pajak |
| tax_code | String | FK ke tax master |
| tax_rate | Decimal | Rate pajak |
| tax_amount | Decimal | Jumlah pajak |
| grand_total | Decimal | Total credit note |
| settlement_type | Enum | deduct_ar / refund / replacement |
| notes | Text | Catatan |
| status | Enum | draft / confirmed / applied / refunded / cancelled |
| created_by | String | Dibuat oleh |
| created_at | DateTime | Tanggal dibuat |

**Detail:**
| Field | Tipe | Keterangan |
|-------|------|------------|
| cn_number | String | FK ke header |
| line_number | Integer | Nomor baris |
| item_code | String | FK ke item |
| item_name | String | Nama item |
| quantity | Decimal | Jumlah |
| unit | String | Satuan |
| unit_price | Decimal | Harga satuan |
| line_total | Decimal | Total baris |

---

### 3.7 Reports & Dashboard

#### 3.7.1 Dashboard
- Total penjualan hari ini / minggu ini / bulan ini
- Jumlah transaksi
- Gross profit & profit margin
- Stok menipis (di bawah min_stock)
- Top 10 item terlaris
- Outstanding invoice (belum lunas)
- Overdue invoice (sudah jatuh tempo)
- Pending delivery (belum kirim)
- Pending return (belum diproses)
- Cash flow chart

#### 3.7.2 Laporan
| Laporan | Keterangan |
|---------|------------|
| Stock Report | Stok per item, lokasi, batch |
| Stock Movement | Pergerakan stok (masuk/keluar) |
| Stock Valuation | Nilai stok berdasarkan HPP |
| Sales Report | Penjualan per periode |
| Sales by Customer | Penjualan per customer |
| Sales by Item | Penjualan per item |
| Profit Report | Laporan profit per item/transaksi |
| Price History | Riwayat perubahan harga |
| HPP Report | Laporan HPP per item |
| AR Aging | Piutang berdasarkan umur |
| AR Statement | Statement of account per customer |
| Payment Report | Laporan pembayaran |
| Return Report | Laporan retur |
| Tax Report | Laporan pajak (untuk pelaporan) |

---

## 4. Nomor Dokumen (Auto Generate)

| Dokumen | Format | Contoh |
|---------|--------|--------|
| Sales Quotation | SQ-YYYYMM-XXXX | SQ-202501-0001 |
| Sales Order | SO-YYYYMM-XXXX | SO-202501-0001 |
| Delivery Order | DO-YYYYMM-XXXX | DO-202501-0001 |
| Shipment | SJ-YYYYMM-XXXX | SJ-202501-0001 |
| Invoice | INV-YYYYMM-XXXX | INV-202501-0001 |
| Payment | PAY-YYYYMM-XXXX | PAY-202501-0001 |
| Return Request | RR-YYYYMM-XXXX | RR-202501-0001 |
| Return Receipt | RCV-YYYYMM-XXXX | RCV-202501-0001 |
| Credit Note | CN-YYYYMM-XXXX | CN-202501-0001 |
| Item Code | SPR-XXXX | SPR-0001 |
| Customer Code | CUS-XXXX | CUS-0001 |
| Batch | BTH-YYYYMMDD-XXX | BTH-20250115-001 |

---

## 5. Status Flow

### 5.1 Sales Quotation Status
```
draft ──▶ sent ──▶ accepted ──▶ (convert to SO)
                └──▶ rejected
                └──▶ expired (auto setelah valid_until)
```

### 5.2 Sales Order Status
```
draft ──▶ confirmed ──▶ partial_delivered ──▶ delivered
     └──▶ cancelled
```

### 5.3 Delivery Order Status
```
draft ──▶ picking ──▶ picked ──▶ shipped
     └──▶ cancelled
```

### 5.4 Shipment Status
```
draft ──▶ in_transit ──▶ delivered
                    └──▶ partial_returned ──▶ (create RR)
                    └──▶ returned ──▶ (create RR)
```

### 5.5 Invoice Status
```
draft ──▶ sent ──▶ partial_paid ──▶ paid
              └──▶ overdue (auto setelah due_date)
     └──▶ cancelled
```

### 5.6 Payment Status
```
draft ──▶ confirmed
     └──▶ bounced (giro tolak)
     └──▶ cancelled
```

### 5.7 Return Request Status
```
draft ──▶ approved ──▶ received ──▶ completed (CN created)
     └──▶ rejected
     └──▶ cancelled
```

### 5.8 Credit Note Status
```
draft ──▶ confirmed ──▶ applied (potong AR)
                   └──▶ refunded (uang dikembalikan)
     └──▶ cancelled
```

---

## 6. Business Rules

### 6.1 Stock Rules
1. Stok di-reserve saat Sales Order confirmed
2. Stok berkurang saat Delivery Order status = picked
3. Stok tidak bisa minus (validasi), kecuali di-setting allow negative
4. FIFO: ambil batch dengan purchase_date paling lama
5. Bisa pilih manual batch/location saat DO
6. Return dengan condition = good → restock
7. Return dengan condition = damaged/unusable → tidak restock, catat sebagai loss

### 6.2 Price Rules
1. Harga jual tidak boleh di bawah HPP (warning, bisa di-override dengan approval)
2. Price movement otomatis tercatat saat update harga
3. HPP dihitung ulang saat ada pembelian baru (jika Average)
4. Harga berbeda per satuan (pcs vs box)
5. Harga grosir berdasarkan min_qty

### 6.3 Tax Rules
1. Tax rate diambil dari tax master berdasarkan tanggal transaksi
2. Tax bisa inclusive atau exclusive
3. Item bisa taxable atau non-taxable
4. Customer bisa taxable atau non-taxable
5. Jika customer non-taxable, tidak kena pajak meskipun item taxable

### 6.4 Document Rules
1. SO bisa dibuat dari SQ atau langsung
2. DO harus reference ke SO
3. Shipment harus reference ke DO
4. Invoice dibuat setelah Shipment delivered
5. 1 SO bisa punya multiple DO (partial delivery)
6. 1 DO = 1 Shipment
7. Return harus reference ke Invoice
8. Credit Note harus reference ke Return Request

### 6.5 Payment Rules
1. Payment bisa dialokasi ke multiple invoice
2. Invoice bisa dibayar dengan multiple payment
3. Giro memiliki due date tersendiri
4. Giro bisa bounced (tolak), otomatis rollback allocation
5. Overpayment menjadi uang muka (prepayment)

### 6.6 Unit Conversion Rules
1. Stok selalu disimpan dalam base_unit
2. Saat jual dengan unit lain, otomatis convert ke base_unit
3. Harga input sesuai unit yang dipilih
4. Konversi hanya dari unit besar ke base_unit (1 arah)

### 6.7 Discount Rules
1. Discount bisa di level header atau per line
2. Header discount: percent atau fixed amount
3. Line discount: percent only
4. Customer punya default discount rate
5. Max discount perlu approval (future feature)

---

## 7. Tech Stack

### 7.1 Framework
```
┌─────────────────────────────────────────┐
│           NEXT.JS 14 (App Router)       │
│         Fullstack Framework              │
├─────────────────────────────────────────┤
│  • Server Components (RSC)              │
│  • Server Actions                        │
│  • API Routes                            │
│  • Built-in optimization                 │
└─────────────────────────────────────────┘
```

### 7.2 Tech Stack Detail
| Layer | Technology |
|-------|------------|
| **Framework** | Next.js 14 (App Router) |
| **Language** | TypeScript |
| **Styling** | Tailwind CSS |
| **UI Components** | shadcn/ui |
| **Forms** | React Hook Form + Zod |
| **State Management** | Zustand / React Query |
| **Database** | MySQL 8.x |
| **ORM** | Prisma |
| **Authentication** | NextAuth.js |
| **PDF Generation** | React-PDF / jsPDF |
| **Charts** | Recharts |
| **Tables** | TanStack Table |
| **Date Handling** | date-fns |
| **Number Formatting** | Intl / numeral.js |

### 7.3 Infrastructure
```
┌─────────────────────────────────────────────────────────────────┐
│                     ARCHITECTURE                                 │
└─────────────────────────────────────────────────────────────────┘

                         ┌──────────────┐
         User ──────────▶│  Cloudflare  │ (Free)
                         │  CDN + DNS   │
                         │  + SSL       │
                         └──────┬───────┘
                                │
                                ▼
                    ┌───────────────────────┐
                    │    Google Cloud       │
                    │                       │
                    │  ┌─────────────────┐  │
                    │  │ Compute Engine  │  │
                    │  │   (VM)          │  │
                    │  │                 │  │
                    │  │  ┌───────────┐  │  │
                    │  │  │  Nginx    │  │  │  ← Reverse Proxy
                    │  │  └─────┬─────┘  │  │
                    │  │        │        │  │
                    │  │  ┌─────▼─────┐  │  │
                    │  │  │  Next.js  │  │  │  ← App (PM2)
                    │  │  └─────┬─────┘  │  │
                    │  │        │        │  │
                    │  │  ┌─────▼─────┐  │  │
                    │  │  │   MySQL   │  │  │  ← Database
                    │  │  └───────────┘  │  │
                    │  │                 │  │
                    │  └─────────────────┘  │
                    │                       │
                    └───────────────────────┘
```

### 7.4 Folder Structure
```
sparepart-inventory/
├── prisma/
│   ├── schema.prisma          # Database schema
│   ├── migrations/            # Migration files
│   └── seed.ts                # Seed data
├── src/
│   ├── app/                   # Next.js App Router
│   │   ├── (auth)/            # Auth routes (login, etc)
│   │   ├── (dashboard)/       # Main app routes
│   │   │   ├── dashboard/
│   │   │   ├── master/
│   │   │   │   ├── items/
│   │   │   │   ├── customers/
│   │   │   │   ├── locations/
│   │   │   │   └── batches/
│   │   │   ├── sales/
│   │   │   │   ├── quotations/
│   │   │   │   ├── orders/
│   │   │   │   ├── delivery-orders/
│   │   │   │   ├── shipments/
│   │   │   │   └── invoices/
│   │   │   ├── inventory/
│   │   │   │   ├── stock/
│   │   │   │   ├── movements/
│   │   │   │   └── adjustments/
│   │   │   ├── payments/
│   │   │   ├── returns/
│   │   │   ├── reports/
│   │   │   └── settings/
│   │   ├── api/               # API routes
│   │   └── layout.tsx
│   ├── components/
│   │   ├── ui/                # shadcn components
│   │   ├── forms/             # Form components
│   │   ├── tables/            # Table components
│   │   ├── modals/            # Modal components
│   │   └── print/             # Print templates
│   ├── lib/
│   │   ├── prisma.ts          # Prisma client
│   │   ├── auth.ts            # Auth config
│   │   ├── utils.ts           # Utilities
│   │   └── constants.ts       # Constants
│   ├── hooks/                 # Custom hooks
│   ├── types/                 # TypeScript types
│   ├── validations/           # Zod schemas
│   └── services/              # Business logic
├── public/
│   └── images/
├── .env
├── .env.example
├── package.json
├── tsconfig.json
├── tailwind.config.js
└── README.md
```

### 7.5 Estimasi Biaya
| Item | Spec | Biaya/bulan |
|------|------|-------------|
| **Google Cloud VM** | e2-small (2 vCPU, 2GB RAM) | ~$13-15 (~Rp 200-250rb) |
| **Static IP** | 1 IP | ~$3 (~Rp 50rb) |
| **Bandwidth** | ~10-50GB egress | ~$1-5 (~Rp 15-80rb) |
| **Cloudflare** | Free plan | $0 |
| **Domain** | .com | ~Rp 150rb/tahun |
| **Total** | | **~Rp 300-400rb/bulan** |

> 💡 Bisa lebih murah dengan e2-micro (free tier) untuk awal-awal

---

## 8. Prototype Scope (Demo)

### Phase 1 - Core Master Data
- [ ] Project setup (Next.js + Tailwind + shadcn)
- [ ] Master Item (CRUD) + Unit Conversion
- [ ] Master Customer (CRUD)
- [ ] Master Location (CRUD)
- [ ] Master Batch (CRUD)
- [ ] Tax Configuration
- [ ] Stock Overview

### Phase 2 - Sales Flow
- [ ] Sales Quotation (create, convert to SO, print)
- [ ] Sales Order (create from SQ, confirm, partial delivery)
- [ ] Delivery Order (create from SO, picking, batch/location selection)
- [ ] Shipment / Surat Jalan (create, print)
- [ ] Invoice (create, print)

### Phase 3 - Payment & Return
- [ ] Payment Receipt (create, allocate to invoice)
- [ ] Return Request (create, approve)
- [ ] Return Receipt (receive, inspect, restock)
- [ ] Credit Note (create, apply)

### Phase 4 - Reports & Dashboard
- [ ] Dashboard with key metrics
- [ ] Stock Report
- [ ] Sales Report
- [ ] AR Aging Report
- [ ] Profit Report

### Phase 5 - Enhancement
- [ ] Price Movement tracking
- [ ] HPP Calculation
- [ ] Multi-user (auth)
- [ ] Export to Excel

---

## 9. UI/UX Guidelines

### 9.1 Navigation Structure
```
├── Dashboard
├── Master Data
│   ├── Items (Sparepart)
│   ├── Customers
│   ├── Locations
│   └── Batches
├── Sales
│   ├── Quotations
│   ├── Sales Orders
│   ├── Delivery Orders
│   ├── Shipments
│   └── Invoices
├── Payments
│   └── Payment Receipts
├── Returns
│   ├── Return Requests
│   ├── Return Receipts
│   └── Credit Notes
├── Inventory
│   ├── Stock Overview
│   ├── Stock Movement
│   └── Stock Adjustment
├── Reports
│   ├── Sales Report
│   ├── Profit Report
│   ├── Stock Report
│   ├── AR Aging
│   └── Tax Report
└── Settings
    ├── Company Profile
    ├── Tax Configuration
    ├── Users
    └── Preferences
```

### 9.2 Color Scheme
| Color | Hex | Usage |
|-------|-----|-------|
| Primary | #3B82F6 | Buttons, links, highlights |
| Success | #10B981 | Success status, positive numbers |
| Warning | #F59E0B | Warning, pending status |
| Danger | #EF4444 | Error, negative numbers, delete |
| Neutral | #6B7280 | Text, borders |

### 9.3 Status Badges
| Status | Color |
|--------|-------|
| Draft | Gray |
| Sent/Confirmed | Blue |
| In Progress | Yellow |
| Completed/Paid | Green |
| Overdue/Cancelled | Red |

### 9.4 Print Templates
Semua dokumen bisa di-print dengan format:
- Header: Logo, nama toko, alamat, kontak
- Document info: Nomor, tanggal, customer
- Table: Item, qty, harga, total
- Summary: Subtotal, diskon, pajak, grand total
- Footer: Notes, tanda tangan, terms

---

## 10. Glossary

| Istilah | Keterangan |
|---------|------------|
| HPP | Harga Pokok Penjualan - biaya untuk mendapatkan barang |
| FIFO | First In First Out - metode stok keluar |
| SQ | Sales Quotation - penawaran harga |
| SO | Sales Order - order penjualan |
| DO | Delivery Order - perintah ambil barang |
| SJ | Surat Jalan - dokumen pengiriman |
| INV | Invoice - tagihan |
| PAY | Payment - pembayaran |
| RR | Return Request - permintaan retur |
| RCV | Return Receipt - penerimaan retur |
| CN | Credit Note - potongan piutang |
| AR | Account Receivable - piutang |
| Batch | Kelompok barang dengan karakteristik sama |
| Reserved | Stok yang sudah dialokasikan untuk order |
| PPN | Pajak Pertambahan Nilai |
| NPWP | Nomor Pokok Wajib Pajak |

---

## 11. Future Features (Roadmap)

### v2.0
- [ ] Purchase Order & Supplier Management
- [ ] Goods Receipt (penerimaan barang beli)
- [ ] Account Payable (hutang)
- [ ] Multi-warehouse transfer
- [ ] User roles & permissions
- [ ] Barcode / QR Code scanning

### v3.0
- [ ] Mobile app (React Native / PWA)
- [ ] Integration dengan marketplace (Tokopedia, Shopee)
- [ ] WhatsApp notification
- [ ] E-Faktur integration
- [ ] Accounting journal integration

### v4.0
- [ ] Analytics & forecasting
- [ ] Reorder point automation
- [ ] Customer portal (cek order/invoice)
- [ ] Multi-company support

---

## 12. API Endpoints (Reference)

### Master Data
```
GET    /api/items                    # List items
POST   /api/items                    # Create item
GET    /api/items/:id                # Get item
PUT    /api/items/:id                # Update item
DELETE /api/items/:id                # Delete item

GET    /api/customers                # List customers
POST   /api/customers                # Create customer
...

GET    /api/locations                # List locations
GET    /api/batches                  # List batches
GET    /api/stock                    # Get stock overview
```

### Sales
```
GET    /api/quotations               # List quotations
POST   /api/quotations               # Create quotation
POST   /api/quotations/:id/convert   # Convert to SO

GET    /api/sales-orders             # List SO
POST   /api/sales-orders             # Create SO
POST   /api/sales-orders/:id/confirm # Confirm SO

GET    /api/delivery-orders          # List DO
POST   /api/delivery-orders          # Create DO
POST   /api/delivery-orders/:id/pick # Mark as picked

GET    /api/shipments                # List shipments
POST   /api/shipments                # Create shipment
POST   /api/shipments/:id/deliver    # Mark as delivered

GET    /api/invoices                 # List invoices
POST   /api/invoices                 # Create invoice
```

### Payments
```
GET    /api/payments                 # List payments
POST   /api/payments                 # Create payment
POST   /api/payments/:id/confirm     # Confirm payment
POST   /api/payments/:id/allocate    # Allocate to invoices
```

### Returns
```
GET    /api/returns                  # List return requests
POST   /api/returns                  # Create return request
POST   /api/returns/:id/approve      # Approve return
POST   /api/returns/:id/receive      # Receive return
POST   /api/returns/:id/credit-note  # Create credit note
```

---

*Dokumentasi ini akan di-update sesuai perkembangan development.*

**Last Updated:** Januari 2025
**Version:** 2.0
