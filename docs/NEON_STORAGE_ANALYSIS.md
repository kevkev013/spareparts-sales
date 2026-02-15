# Analisis Storage Neon PostgreSQL (Free Tier 500 MB)

## Konteks

Aplikasi spareparts-sales menggunakan **Neon PostgreSQL free tier** dengan batas storage **500 MB**. Dokumen ini menganalisis kapan storage akan penuh berdasarkan skenario penggunaan bisnis.

---

## Schema Database: 24 Tabel

| Kategori | Tabel | Jumlah |
|----------|-------|--------|
| Master Data | items, unit_conversions, unit_prices, customers, locations, batches, stocks | 7 |
| Sales Flow | sales_quotations, sales_quotation_items, sales_orders, sales_order_items, delivery_orders, delivery_order_items, shipments, invoices, invoice_items | 9 |
| Payments & Returns | payments, returns, return_items | 3 |
| Config | tax_master, tax_history, price_movements | 3 |
| Auth | users, roles | 2 |

---

## Storage Per Transaksi

Setiap **1 sales order lengkap** (Quotation → Sales Order → Delivery Order → Shipment → Invoice → Payment) menghasilkan:

| Tabel | Rows | Size/Row (data + index) | Subtotal |
|-------|------|------------------------|----------|
| sales_quotations | 1 | 459 bytes | 459 B |
| sales_quotation_items | 3 | 308 bytes | 924 B |
| sales_orders | 1 | 574 bytes | 574 B |
| sales_order_items | 3 | 324 bytes | 972 B |
| delivery_orders | 1 | 502 bytes | 502 B |
| delivery_order_items | 3 | 471 bytes | 1,413 B |
| shipments | 1 | 661 bytes | 661 B |
| invoices | 1 | 544 bytes | 544 B |
| invoice_items | 3 | 304 bytes | 912 B |
| payments | 1 | 460 bytes | 460 B |
| returns (5% rate) | 0.05 | 392 bytes | 20 B |
| return_items | 0.075 | 281 bytes | 21 B |
| **Total** | **~18 rows** | | **~6,462 B** |

Dengan PostgreSQL MVCC bloat (~15%): **~7.4 KB per transaksi**

> **Catatan:** Size termasuk tuple header (24 bytes), NULL bitmap, dan semua B-tree index entries per tabel.

---

## Proyeksi Berdasarkan Volume Transaksi Harian

### Rumus Cepat

```
Storage per tahun (MB) = tx_per_hari × 30 × 7.4 KB × 12 / 1024
Waktu penuh (tahun)    = 496 MB / storage_per_tahun
```

> 496 MB = 500 MB limit - 4 MB initial footprint (system catalogs + seed data + migrations)

### Tabel Proyeksi

| Tx/Hari | Tx/Bulan | MB/Bulan | MB/Tahun | Penuh 500 MB |
|---------|----------|----------|----------|-------------|
| 1 | 30 | 0.2 MB | 2.6 MB | ~190 tahun |
| 2 | 60 | 0.4 MB | 5.2 MB | ~95 tahun |
| 5 | 150 | 1.1 MB | 13 MB | ~38 tahun |
| 7 | 210 | 1.5 MB | 18 MB | ~27 tahun |
| 10 | 300 | 2.2 MB | 27 MB | ~19 tahun |
| 20 | 600 | 4.3 MB | 53 MB | ~9 tahun |
| 50 | 1,500 | 10.8 MB | 133 MB | ~3.7 tahun |
| 100 | 3,000 | 21.7 MB | 266 MB | ~1.9 tahun |

### Akumulasi Storage (dalam MB)

| Waktu | 2 tx/hari | 5 tx/hari | 10 tx/hari | 20 tx/hari | 50 tx/hari |
|-------|-----------|-----------|------------|------------|------------|
| 6 bulan | 6.6 | 10.5 | 17.5 | 30.5 | 68.0 |
| 1 tahun | 9.2 | 17.0 | 31.0 | 57.0 | 137.0 |
| 2 tahun | 14.4 | 30.0 | 58.0 | 110.0 | 270.0 |
| 3 tahun | 19.6 | 43.0 | 85.0 | 163.0 | 403.0 |
| 5 tahun | 30.0 | 69.0 | 139.0 | 269.0 | **penuh** |
| 10 tahun | 56.0 | 134.0 | 274.0 | **penuh** | - |

> Angka di atas sudah termasuk initial footprint 4 MB.

---

## Skenario Bisnis Spareparts

| Tipe Bisnis | Estimasi Tx/Hari | Penuh 500 MB |
|-------------|-----------------|-------------|
| Bengkel kecil / toko kelontong spareparts | 1-3 | 60-190 tahun |
| Toko spareparts menengah | 5-10 | 19-38 tahun |
| Toko besar / multi-cabang | 15-25 | 8-13 tahun |
| Distributor regional | 30-50 | 4-6 tahun |
| Distributor besar / multi-warehouse | 50-100 | 1.9-3.7 tahun |

---

## Kenapa Storage Sangat Efisien?

1. **Tidak ada file/gambar** di database. Semua kolom hanya teks pendek dan angka.
2. **Row terbesar** (Shipment) hanya ~311 bytes — jauh di bawah threshold TOAST PostgreSQL (2 KB).
3. **Decimal fields** disimpan compact (8 bytes per kolom, bukan string).
4. **UUID primary keys** = 16 bytes (lebih kecil dari VARCHAR(36)).

---

## Yang Bisa Bikin Cepat Penuh

| Fitur | Dampak | Solusi |
|-------|--------|--------|
| Simpan gambar/foto produk di DB | Bisa 100 KB - 5 MB per gambar | Pakai object storage (S3, Cloudflare R2, Supabase Storage) |
| Audit log setiap API call | ~200-500 bytes per log entry, ribuan per hari | Time-based partitioning + purge policy |
| Activity log per klik user | ~100-200 bytes per event | Pakai external service (Mixpanel, PostHog) atau log rotation |
| Chat/messaging internal | Variable, bisa besar | Pakai service terpisah |

---

## Rekomendasi

1. **Tidak perlu khawatir** untuk mayoritas bisnis spareparts. Free tier cukup untuk bertahun-tahun.
2. **Monitor berkala** dengan query: `SELECT pg_database_size(current_database()) / 1024 / 1024 AS size_mb;`
3. **Jika mendekati limit**, opsi:
   - Upgrade Neon ke paid plan (Launch plan: 10 GB, $19/bulan)
   - Archive data lama (transaksi > 2-3 tahun) ke cold storage
   - VACUUM FULL pada tabel besar untuk reclaim space dari dead tuples
4. **Jangan simpan file/gambar di database** — selalu gunakan object storage eksternal.

---

*Analisis dibuat: Februari 2026*
*Berdasarkan schema Prisma v24 tabel, PostgreSQL row overhead, dan B-tree index estimation.*
