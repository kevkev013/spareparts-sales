import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { apiError } from '@/lib/api-error'
import bcrypt from 'bcryptjs'
import { DEFAULT_ROLES } from '@/lib/permissions'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only Admin role can reset data
    if (session.user.role !== 'Admin') {
      return NextResponse.json({ error: 'Hanya Admin yang dapat menghapus data' }, { status: 403 })
    }

    const body = await request.json()
    if (body.confirmText !== 'HAPUS SEMUA DATA') {
      return NextResponse.json(
        { error: 'Konfirmasi tidak valid. Ketik "HAPUS SEMUA DATA" untuk melanjutkan.' },
        { status: 400 }
      )
    }

    // Delete all data in correct FK order using a transaction
    const result = await prisma.$transaction(async (tx) => {
      const counts: Record<string, number> = {}

      // 1. Payments (depends on Invoice, Customer)
      const payments = await tx.payment.deleteMany()
      counts.payment = payments.count

      // 2. ReturnItems + Returns (depends on Customer, SalesOrder)
      const returnItems = await tx.returnItem.deleteMany()
      counts.returnItem = returnItems.count
      const returns = await tx.return.deleteMany()
      counts.return = returns.count

      // 3. InvoiceItems + Invoices (depends on SalesOrder, Customer)
      const invoiceItems = await tx.invoiceItem.deleteMany()
      counts.invoiceItem = invoiceItems.count
      const invoices = await tx.invoice.deleteMany()
      counts.invoice = invoices.count

      // 4. Shipments (depends on DeliveryOrder, SalesOrder, Customer)
      const shipments = await tx.shipment.deleteMany()
      counts.shipment = shipments.count

      // 5. DeliveryOrderItems + DeliveryOrders (depends on SalesOrder, Customer)
      const doItems = await tx.deliveryOrderItem.deleteMany()
      counts.deliveryOrderItem = doItems.count
      const deliveryOrders = await tx.deliveryOrder.deleteMany()
      counts.deliveryOrder = deliveryOrders.count

      // 6. SalesOrderItems + SalesOrders (depends on Customer, SalesQuotation)
      const soItems = await tx.salesOrderItem.deleteMany()
      counts.salesOrderItem = soItems.count
      const salesOrders = await tx.salesOrder.deleteMany()
      counts.salesOrder = salesOrders.count

      // 7. SalesQuotationItems + SalesQuotations (depends on Customer)
      const sqItems = await tx.salesQuotationItem.deleteMany()
      counts.salesQuotationItem = sqItems.count
      const salesQuotations = await tx.salesQuotation.deleteMany()
      counts.salesQuotation = salesQuotations.count

      // 8. Stock (depends on Item, Location, Batch)
      const stocks = await tx.stock.deleteMany()
      counts.stock = stocks.count

      // 9. Batch (depends on Item)
      const batches = await tx.batch.deleteMany()
      counts.batch = batches.count

      // 10. PriceMovement (depends on Item)
      const priceMovements = await tx.priceMovement.deleteMany()
      counts.priceMovement = priceMovements.count

      // 11. TaxHistory (depends on TaxMaster)
      const taxHistory = await tx.taxHistory.deleteMany()
      counts.taxHistory = taxHistory.count

      // 12. UnitPrice + UnitConversion (depends on Item)
      const unitPrices = await tx.unitPrice.deleteMany()
      counts.unitPrice = unitPrices.count
      const unitConversions = await tx.unitConversion.deleteMany()
      counts.unitConversion = unitConversions.count

      // 13. Items
      const items = await tx.item.deleteMany()
      counts.item = items.count

      // 14. Locations
      const locations = await tx.location.deleteMany()
      counts.location = locations.count

      // 15. TaxMaster
      const taxMasters = await tx.taxMaster.deleteMany()
      counts.taxMaster = taxMasters.count

      // 16. Customers
      const customers = await tx.customer.deleteMany()
      counts.customer = customers.count

      // 17. Users (except current admin)
      const users = await tx.user.deleteMany({
        where: { id: { not: session.user.id } },
      })
      counts.user = users.count

      // 18. Roles (except system roles)
      const roles = await tx.role.deleteMany({
        where: { isSystem: false },
      })
      counts.role = roles.count

      return counts
    })

    // Re-seed base data: roles, tax master
    for (const role of DEFAULT_ROLES) {
      await prisma.role.upsert({
        where: { name: role.name },
        update: { permissions: role.permissions },
        create: {
          name: role.name,
          description: role.description,
          isSystem: role.isSystem,
          permissions: role.permissions,
        },
      })
    }

    // Ensure current admin user has correct role
    const adminRole = await prisma.role.findUnique({ where: { name: 'Admin' } })
    if (adminRole) {
      await prisma.user.update({
        where: { id: session.user.id },
        data: { roleId: adminRole.id },
      })
    }

    // Re-seed tax master
    await prisma.taxMaster.createMany({
      data: [
        {
          taxCode: 'PPN-11',
          taxName: 'PPN 11%',
          taxRate: 11.0,
          taxType: 'exclusive',
          isDefault: false,
          effectiveFrom: new Date('2022-04-01'),
          effectiveTo: new Date('2024-12-31'),
          isActive: false,
        },
        {
          taxCode: 'PPN-12',
          taxName: 'PPN 12%',
          taxRate: 12.0,
          taxType: 'exclusive',
          isDefault: true,
          effectiveFrom: new Date('2025-01-01'),
          effectiveTo: null,
          isActive: true,
        },
        {
          taxCode: 'NON-TAX',
          taxName: 'Non-Taxable',
          taxRate: 0.0,
          taxType: 'exclusive',
          isDefault: false,
          effectiveFrom: new Date('2020-01-01'),
          effectiveTo: null,
          isActive: true,
        },
      ],
      skipDuplicates: true,
    })

    return NextResponse.json({
      message: 'Semua data berhasil dihapus. Base data (roles, tax) sudah di-seed ulang.',
      deletedCounts: result,
    })
  } catch (error) {
    return apiError(error, 'Gagal menghapus data')
  }
}
