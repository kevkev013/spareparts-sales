import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { apiError } from '@/lib/api-error'
import { createSalesOrder } from '@/services/sales-order.service'
import { createDeliveryOrder, completePicking } from '@/services/delivery-order.service'
import { createShipment, markAsDelivered } from '@/services/shipment.service'
import { createInvoice } from '@/services/invoice.service'
import { createPayment } from '@/services/payment.service'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'Admin') {
      return NextResponse.json({ error: 'Hanya Admin yang dapat mengisi sample data' }, { status: 403 })
    }

    const created: string[] = []

    // Step 1: Seed master data (locations, customers, items, batches, stock)
    await seedMasterData()
    created.push('Master data: 4 locations, 3 customers, 3 items, 2 batches, 2 stocks')

    // Step 2: Create sample Sales Quotation
    const sqId = await seedSalesQuotation()
    created.push(`Sales Quotation: ${sqId}`)

    // Step 3: Create Sales Order (with items that have stock)
    const soId = await createSalesOrder({
      soDate: new Date(),
      customerCode: 'CUS-0001',
      status: 'confirmed',
      deliveryAddress: 'Jl. Merdeka No. 123, Jakarta',
      deliveryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      notes: 'Sample order untuk demo',
      items: [
        {
          itemCode: 'SPR-0001',
          quantity: 5,
          unit: 'liter',
          unitPrice: 110000,
          discountPercent: 5,
        },
        {
          itemCode: 'SPR-0002',
          quantity: 10,
          unit: 'pcs',
          unitPrice: 50000,
          discountPercent: 5,
        },
      ],
    })
    created.push(`Sales Order: ${soId}`)

    // Step 4: Create Delivery Order (auto-picks stock)
    const doId = await createDeliveryOrder(soId, 'Picker Demo')
    created.push(`Delivery Order: ${doId}`)

    // Step 5: Complete picking
    await completePicking(doId)
    created.push('Picking completed')

    // Step 6: Create Shipment
    const shipmentId = await createShipment({
      sjDate: new Date(),
      doId: doId,
      driverName: 'Ahmad Supir',
      vehicleNumber: 'B 1234 XYZ',
      deliveryAddress: 'Jl. Merdeka No. 123, Jakarta',
      recipient: 'Bengkel Jaya Motor',
      notes: 'Handle with care',
    })
    created.push(`Shipment: ${shipmentId}`)

    // Step 7: Mark shipment as delivered
    await markAsDelivered(shipmentId)
    created.push('Shipment delivered')

    // Step 8: Create Invoice (auto-calculates HPP & profit)
    const invoiceId = await createInvoice(soId, 30)
    created.push(`Invoice: ${invoiceId}`)

    // Step 9: Create partial payment
    const invoice = await prisma.invoice.findUnique({ where: { id: invoiceId } })
    if (invoice) {
      const paymentAmount = Math.round(Number(invoice.grandTotal) * 0.6) // 60% payment
      const paymentId = await createPayment({
        paymentDate: new Date(),
        invoiceId: invoiceId,
        amount: paymentAmount,
        paymentMethod: 'transfer',
        referenceNumber: 'TF-DEMO-001',
        notes: 'Pembayaran DP 60%',
      })
      created.push(`Payment: ${paymentId} (Rp ${paymentAmount.toLocaleString('id-ID')})`)
    }

    // Step 10: Create a second SO (confirmed but not yet delivered) for variety
    const soId2 = await createSalesOrder({
      soDate: new Date(),
      customerCode: 'CUS-0002',
      status: 'confirmed',
      deliveryAddress: 'Jl. Sudirman No. 456, Bandung',
      deliveryDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      notes: 'Order kedua untuk demo',
      items: [
        {
          itemCode: 'SPR-0001',
          quantity: 10,
          unit: 'liter',
          unitPrice: 110000,
          discountPercent: 10,
        },
      ],
    })
    created.push(`Sales Order 2 (pending): ${soId2}`)

    return NextResponse.json({
      message: 'Sample data berhasil dibuat! Silakan cek halaman Reports.',
      created,
    })
  } catch (error) {
    return apiError(error, 'Gagal membuat sample data')
  }
}

async function seedMasterData() {
  // Locations
  await prisma.location.createMany({
    data: [
      { locationCode: 'GD-A1', locationName: 'Gudang A - Rak 1', warehouse: 'Gudang Utama', zone: 'storage', description: 'Rak penyimpanan untuk oli dan filter' },
      { locationCode: 'GD-A2', locationName: 'Gudang A - Rak 2', warehouse: 'Gudang Utama', zone: 'storage', description: 'Rak penyimpanan untuk kampas rem dan bearing' },
      { locationCode: 'GD-B1', locationName: 'Gudang B - Rak 1', warehouse: 'Gudang Utama', zone: 'storage', description: 'Rak penyimpanan untuk suku cadang besar' },
      { locationCode: 'SHP-01', locationName: 'Area Shipping', warehouse: 'Gudang Utama', zone: 'shipping', description: 'Area untuk barang siap kirim' },
    ],
    skipDuplicates: true,
  })

  // Customers
  await prisma.customer.createMany({
    data: [
      { customerCode: 'CUS-0001', customerName: 'Bengkel Jaya Motor', customerType: 'bengkel', phone: '081234567890', email: 'bengkeljaya@example.com', address: 'Jl. Merdeka No. 123', city: 'Jakarta', discountRate: 5.0, creditLimit: 10000000, creditTerm: 30, isTaxable: true },
      { customerCode: 'CUS-0002', customerName: 'Toko Sparepart Makmur', customerType: 'wholesale', phone: '081234567891', email: 'makmur@example.com', address: 'Jl. Sudirman No. 456', city: 'Bandung', discountRate: 10.0, creditLimit: 25000000, creditTerm: 45, isTaxable: true },
      { customerCode: 'CUS-0003', customerName: 'Budi Santoso', customerType: 'retail', phone: '081234567892', email: 'budi@example.com', address: 'Jl. Ahmad Yani No. 789', city: 'Surabaya', discountRate: 0.0, creditLimit: 0, creditTerm: 0, isTaxable: false },
    ],
    skipDuplicates: true,
  })

  // Items
  const items = [
    { itemCode: 'SPR-0001', itemName: 'Oli Mesin Shell Helix HX7 10W-40', category: 'Oli Mesin', brand: 'Shell', baseUnit: 'liter', basePrice: 85000, sellingPrice: 110000, minStock: 50, description: 'Oli mesin semi-synthetic', compatibleMotors: ['Honda Beat', 'Yamaha NMAX', 'Honda PCX'], isTaxable: true },
    { itemCode: 'SPR-0002', itemName: 'Kampas Rem Depan Honda Beat', category: 'Kampas Rem', brand: 'Honda', baseUnit: 'pcs', basePrice: 35000, sellingPrice: 50000, minStock: 20, description: 'Kampas rem depan original', compatibleMotors: ['Honda Beat', 'Honda Scoopy'], isTaxable: true },
    { itemCode: 'SPR-0003', itemName: 'Busi NGK Iridium', category: 'Busi', brand: 'NGK', baseUnit: 'pcs', basePrice: 45000, sellingPrice: 65000, minStock: 30, description: 'Busi iridium performa maksimal', compatibleMotors: ['Universal'], isTaxable: true },
  ]

  for (const item of items) {
    await prisma.item.upsert({
      where: { itemCode: item.itemCode },
      update: {},
      create: item,
    })
  }

  // Unit conversions
  await prisma.unitConversion.createMany({
    data: [
      { itemCode: 'SPR-0001', fromUnit: 'galon', toUnit: 'liter', conversionFactor: 4 },
      { itemCode: 'SPR-0002', fromUnit: 'set', toUnit: 'pcs', conversionFactor: 2 },
      { itemCode: 'SPR-0003', fromUnit: 'box', toUnit: 'pcs', conversionFactor: 10 },
    ],
    skipDuplicates: true,
  })

  // Unit prices
  await prisma.unitPrice.createMany({
    data: [
      { itemCode: 'SPR-0001', unit: 'liter', buyingPrice: 85000, sellingPrice: 110000, minQty: 1 },
      { itemCode: 'SPR-0001', unit: 'galon', buyingPrice: 320000, sellingPrice: 420000, minQty: 1 },
      { itemCode: 'SPR-0002', unit: 'pcs', buyingPrice: 35000, sellingPrice: 50000, minQty: 1 },
      { itemCode: 'SPR-0002', unit: 'set', buyingPrice: 65000, sellingPrice: 95000, minQty: 1 },
      { itemCode: 'SPR-0003', unit: 'pcs', buyingPrice: 45000, sellingPrice: 65000, minQty: 1 },
    ],
    skipDuplicates: true,
  })

  // Batches
  const batch1 = await prisma.batch.upsert({
    where: { batchNumber: 'BTH-20250115-001' },
    update: {},
    create: { batchNumber: 'BTH-20250115-001', itemCode: 'SPR-0001', purchaseDate: new Date('2025-01-15'), purchasePrice: 85000, supplier: 'PT Shell Indonesia', characteristics: { grade: 'A', origin: 'Indonesia' } },
  })

  const batch2 = await prisma.batch.upsert({
    where: { batchNumber: 'BTH-20250115-002' },
    update: {},
    create: { batchNumber: 'BTH-20250115-002', itemCode: 'SPR-0002', purchaseDate: new Date('2025-01-15'), purchasePrice: 35000, supplier: 'PT Astra Honda Motor', characteristics: { grade: 'Original' } },
  })

  // Stock - upsert to handle existing stock
  await prisma.stock.upsert({
    where: { itemCode_locationCode_batchNumber: { itemCode: 'SPR-0001', locationCode: 'GD-A1', batchNumber: 'BTH-20250115-001' } },
    update: { quantity: 100, availableQty: 100, reservedQty: 0 },
    create: { itemCode: 'SPR-0001', locationCode: 'GD-A1', batchNumber: 'BTH-20250115-001', quantity: 100, reservedQty: 0, availableQty: 100 },
  })

  await prisma.stock.upsert({
    where: { itemCode_locationCode_batchNumber: { itemCode: 'SPR-0002', locationCode: 'GD-A2', batchNumber: 'BTH-20250115-002' } },
    update: { quantity: 50, availableQty: 50, reservedQty: 0 },
    create: { itemCode: 'SPR-0002', locationCode: 'GD-A2', batchNumber: 'BTH-20250115-002', quantity: 50, reservedQty: 0, availableQty: 50 },
  })
}

async function seedSalesQuotation() {
  const sqNumber = 'SQ-202502-0001'

  const existing = await prisma.salesQuotation.findFirst({ where: { sqNumber } })
  if (existing) return existing.id

  const sq = await prisma.salesQuotation.create({
    data: {
      sqNumber,
      sqDate: new Date(),
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      customerCode: 'CUS-0001',
      subtotal: 1025000,
      discountAmount: 51250,
      taxAmount: 116850,
      grandTotal: 1090600,
      status: 'accepted',
      notes: 'Quotation sample untuk demo',
      items: {
        create: [
          { itemCode: 'SPR-0001', quantity: 5, unit: 'liter', unitPrice: 110000, discountPercent: 5, subtotal: 522500 },
          { itemCode: 'SPR-0002', quantity: 10, unit: 'pcs', unitPrice: 50000, discountPercent: 5, subtotal: 475000 },
        ],
      },
    },
  })

  return sq.id
}
