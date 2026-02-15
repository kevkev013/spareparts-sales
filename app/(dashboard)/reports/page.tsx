import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  ShoppingCart,
  DollarSign,
  TrendingUp,
  Package,
  AlertTriangle,
  Clock,
  CheckCircle,
  FileText,
} from 'lucide-react'
import { prisma } from '@/lib/prisma'

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount)
}

function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat('id-ID', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(date))
}

async function getReportsData() {
  // Sales summary
  const totalOrders = await prisma.salesOrder.count()
  const activeOrders = await prisma.salesOrder.count({
    where: { status: { in: ['confirmed', 'processing', 'partial_fulfilled'] } },
  })
  const fulfilledOrders = await prisma.salesOrder.count({
    where: { status: 'fulfilled' },
  })

  // Quotation stats
  const totalQuotations = await prisma.salesQuotation.count()
  const activeQuotations = await prisma.salesQuotation.count({
    where: { status: { in: ['draft', 'sent'] } },
  })
  const acceptedQuotations = await prisma.salesQuotation.count({
    where: { status: 'accepted' },
  })
  const convertedQuotations = await prisma.salesQuotation.count({
    where: { status: 'converted' },
  })

  // Invoice & Revenue
  const invoices = await prisma.invoice.findMany({
    select: {
      grandTotal: true,
      hpp: true,
      profit: true,
      paidAmount: true,
      remainingAmount: true,
      status: true,
      invDate: true,
    },
  })

  const totalRevenue = invoices.reduce((sum, inv) => sum + Number(inv.grandTotal), 0)
  const totalHPP = invoices.reduce((sum, inv) => sum + Number(inv.hpp), 0)
  const totalProfit = invoices.reduce((sum, inv) => sum + Number(inv.profit), 0)
  const totalPaid = invoices.reduce((sum, inv) => sum + Number(inv.paidAmount), 0)
  const totalOutstanding = invoices.reduce((sum, inv) => sum + Number(inv.remainingAmount), 0)
  const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0

  const unpaidInvoices = invoices.filter((inv) => inv.status === 'unpaid').length
  const partialPaidInvoices = invoices.filter((inv) => inv.status === 'partial_paid').length
  const overdueInvoices = invoices.filter((inv) => inv.status === 'overdue').length
  const paidInvoices = invoices.filter((inv) => inv.status === 'paid').length

  // Inventory stats
  const totalItems = await prisma.item.count({ where: { isActive: true } })
  const items = await prisma.item.findMany({
    where: { isActive: true },
    include: {
      stocks: { select: { quantity: true, availableQty: true } },
    },
  })

  const lowStockItems = items.filter((item) => {
    const totalStock = item.stocks.reduce((sum, s) => sum + Number(s.quantity), 0)
    return totalStock <= item.minStock
  })

  const outOfStockItems = items.filter((item) => {
    const totalStock = item.stocks.reduce((sum, s) => sum + Number(s.quantity), 0)
    return totalStock === 0
  })

  const totalStockValue = items.reduce((sum, item) => {
    const totalStock = item.stocks.reduce((acc, s) => acc + Number(s.quantity), 0)
    return sum + totalStock * Number(item.basePrice)
  }, 0)

  const totalSellingValue = items.reduce((sum, item) => {
    const totalStock = item.stocks.reduce((acc, s) => acc + Number(s.quantity), 0)
    return sum + totalStock * Number(item.sellingPrice)
  }, 0)

  // Payment stats
  const payments = await prisma.payment.findMany({
    select: {
      amount: true,
      paymentMethod: true,
      paymentDate: true,
    },
  })

  const totalPayments = payments.reduce((sum, p) => sum + Number(p.amount), 0)

  const paymentByMethod: Record<string, number> = {}
  payments.forEach((p) => {
    const method = p.paymentMethod
    paymentByMethod[method] = (paymentByMethod[method] || 0) + Number(p.amount)
  })

  // Top customers by revenue
  const topCustomers = await prisma.invoice.groupBy({
    by: ['customerCode'],
    _sum: { grandTotal: true },
    _count: true,
    orderBy: { _sum: { grandTotal: 'desc' } },
    take: 5,
  })

  const customerDetails = await prisma.customer.findMany({
    where: { customerCode: { in: topCustomers.map((c) => c.customerCode) } },
    select: { customerCode: true, customerName: true, customerType: true },
  })

  const topCustomersData = topCustomers.map((c) => {
    const detail = customerDetails.find((d) => d.customerCode === c.customerCode)
    return {
      customerCode: c.customerCode,
      customerName: detail?.customerName || c.customerCode,
      customerType: detail?.customerType || 'retail',
      totalRevenue: Number(c._sum.grandTotal || 0),
      orderCount: c._count,
    }
  })

  // Top selling items
  const topItems = await prisma.invoiceItem.groupBy({
    by: ['itemCode'],
    _sum: { quantity: true, subtotal: true, profit: true },
    orderBy: { _sum: { subtotal: 'desc' } },
    take: 5,
  })

  const itemDetails = await prisma.item.findMany({
    where: { itemCode: { in: topItems.map((i) => i.itemCode) } },
    select: { itemCode: true, itemName: true, category: true, baseUnit: true },
  })

  const topItemsData = topItems.map((i) => {
    const detail = itemDetails.find((d) => d.itemCode === i.itemCode)
    return {
      itemCode: i.itemCode,
      itemName: detail?.itemName || i.itemCode,
      category: detail?.category || '-',
      baseUnit: detail?.baseUnit || 'pcs',
      totalQty: Number(i._sum.quantity || 0),
      totalRevenue: Number(i._sum.subtotal || 0),
      totalProfit: Number(i._sum.profit || 0),
    }
  })

  // Recent orders
  const recentOrders = await prisma.salesOrder.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' },
    include: {
      customer: { select: { customerName: true } },
    },
  })

  // Shipment stats
  const totalShipments = await prisma.shipment.count()
  const inTransit = await prisma.shipment.count({ where: { status: 'in_transit' } })
  const delivered = await prisma.shipment.count({ where: { status: 'delivered' } })

  // Return stats
  const totalReturns = await prisma.return.count()
  const pendingReturns = await prisma.return.count({ where: { status: 'pending' } })

  return {
    sales: {
      totalOrders,
      activeOrders,
      fulfilledOrders,
      totalQuotations,
      activeQuotations,
      acceptedQuotations,
      convertedQuotations,
    },
    financial: {
      totalRevenue,
      totalHPP,
      totalProfit,
      profitMargin,
      totalPaid,
      totalOutstanding,
      unpaidInvoices,
      partialPaidInvoices,
      overdueInvoices,
      paidInvoices,
      totalInvoices: invoices.length,
    },
    inventory: {
      totalItems,
      lowStockCount: lowStockItems.length,
      outOfStockCount: outOfStockItems.length,
      totalStockValue,
      totalSellingValue,
      potentialProfit: totalSellingValue - totalStockValue,
    },
    payments: {
      totalPayments,
      paymentCount: payments.length,
      paymentByMethod,
    },
    topCustomers: topCustomersData,
    topItems: topItemsData,
    recentOrders: recentOrders.map((o) => ({
      soNumber: o.soNumber,
      soDate: o.soDate,
      customerName: o.customer.customerName,
      grandTotal: Number(o.grandTotal),
      status: o.status,
    })),
    delivery: {
      totalShipments,
      inTransit,
      delivered,
    },
    returns: {
      totalReturns,
      pendingReturns,
    },
  }
}

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  cash: 'Tunai',
  transfer: 'Transfer',
  check: 'Cek',
  giro: 'Giro',
  credit_card: 'Kartu Kredit',
  other: 'Lainnya',
}

const STATUS_LABELS: Record<string, string> = {
  confirmed: 'Terkonfirmasi',
  processing: 'Diproses',
  partial_fulfilled: 'Sebagian',
  fulfilled: 'Terpenuhi',
  cancelled: 'Dibatalkan',
}

const STATUS_COLORS: Record<string, string> = {
  confirmed: 'bg-blue-100 text-blue-800',
  processing: 'bg-yellow-100 text-yellow-800',
  partial_fulfilled: 'bg-orange-100 text-orange-800',
  fulfilled: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
}

const CUSTOMER_TYPE_LABELS: Record<string, string> = {
  retail: 'Retail',
  wholesale: 'Grosir',
  bengkel: 'Bengkel',
}

export default async function ReportsPage() {
  const data = await getReportsData()

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Laporan</h1>
        <p className="text-gray-600">Ringkasan data penjualan, inventory, dan keuangan</p>
      </div>

      {/* Revenue & Profit Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(data.financial.totalRevenue)}</div>
            <p className="text-xs text-gray-600 mt-1">Dari {data.financial.totalInvoices} invoice</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Profit</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(data.financial.totalProfit)}</div>
            <p className="text-xs text-gray-600 mt-1">
              Margin: {data.financial.profitMargin.toFixed(1)}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Dibayar</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(data.financial.totalPaid)}</div>
            <p className="text-xs text-gray-600 mt-1">{data.payments.paymentCount} pembayaran</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Piutang</CardTitle>
            <Clock className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(data.financial.totalOutstanding)}
            </div>
            <p className="text-xs text-gray-600 mt-1">
              {data.financial.overdueInvoices > 0 && (
                <span className="text-red-600">{data.financial.overdueInvoices} jatuh tempo</span>
              )}
              {data.financial.overdueInvoices === 0 && 'Tidak ada yang jatuh tempo'}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Sales Order Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Ringkasan Penjualan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Total Quotation</p>
                  <p className="text-2xl font-bold">{data.sales.totalQuotations}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {data.sales.activeQuotations} aktif, {data.sales.convertedQuotations} dikonversi
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Total Sales Order</p>
                  <p className="text-2xl font-bold">{data.sales.totalOrders}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {data.sales.activeOrders} aktif, {data.sales.fulfilledOrders} selesai
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="bg-blue-50 p-3 rounded-lg text-center">
                  <p className="text-lg font-bold text-blue-700">{data.delivery.totalShipments}</p>
                  <p className="text-xs text-blue-600">Pengiriman</p>
                </div>
                <div className="bg-yellow-50 p-3 rounded-lg text-center">
                  <p className="text-lg font-bold text-yellow-700">{data.delivery.inTransit}</p>
                  <p className="text-xs text-yellow-600">Dalam Perjalanan</p>
                </div>
                <div className="bg-green-50 p-3 rounded-lg text-center">
                  <p className="text-lg font-bold text-green-700">{data.delivery.delivered}</p>
                  <p className="text-xs text-green-600">Terkirim</p>
                </div>
              </div>

              {data.returns.totalReturns > 0 && (
                <div className="bg-red-50 p-3 rounded-lg flex justify-between items-center">
                  <span className="text-sm text-red-700">Return Request</span>
                  <div className="text-right">
                    <span className="font-bold text-red-700">{data.returns.totalReturns}</span>
                    {data.returns.pendingReturns > 0 && (
                      <span className="text-xs text-red-500 ml-2">
                        ({data.returns.pendingReturns} pending)
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Invoice Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Status Invoice
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">HPP (Harga Pokok)</p>
                  <p className="text-xl font-bold">{formatCurrency(data.financial.totalHPP)}</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-sm text-green-600">Profit Bersih</p>
                  <p className="text-xl font-bold text-green-700">{formatCurrency(data.financial.totalProfit)}</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                    <span className="text-sm">Lunas</span>
                  </div>
                  <span className="font-medium">{data.financial.paidInvoices}</span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-orange-500" />
                    <span className="text-sm">Dibayar Sebagian</span>
                  </div>
                  <span className="font-medium">{data.financial.partialPaidInvoices}</span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-yellow-500" />
                    <span className="text-sm">Belum Dibayar</span>
                  </div>
                  <span className="font-medium">{data.financial.unpaidInvoices}</span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500" />
                    <span className="text-sm">Jatuh Tempo</span>
                  </div>
                  <span className="font-medium text-red-600">{data.financial.overdueInvoices}</span>
                </div>
              </div>

              {Object.keys(data.payments.paymentByMethod).length > 0 && (
                <div className="border-t pt-4">
                  <p className="text-sm font-medium text-gray-600 mb-3">Metode Pembayaran</p>
                  <div className="space-y-2">
                    {Object.entries(data.payments.paymentByMethod).map(([method, amount]) => (
                      <div key={method} className="flex justify-between items-center text-sm">
                        <span>{PAYMENT_METHOD_LABELS[method] || method}</span>
                        <span className="font-medium">{formatCurrency(amount)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Inventory Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Ringkasan Inventory
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg text-center">
                  <p className="text-2xl font-bold text-blue-700">{data.inventory.totalItems}</p>
                  <p className="text-xs text-blue-600">Total Item</p>
                </div>
                <div className="bg-yellow-50 p-4 rounded-lg text-center">
                  <p className="text-2xl font-bold text-yellow-700">{data.inventory.lowStockCount}</p>
                  <p className="text-xs text-yellow-600">Stok Menipis</p>
                </div>
                <div className="bg-red-50 p-4 rounded-lg text-center">
                  <p className="text-2xl font-bold text-red-700">{data.inventory.outOfStockCount}</p>
                  <p className="text-xs text-red-600">Stok Habis</p>
                </div>
              </div>

              <div className="space-y-3 border-t pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Nilai Stok (Harga Beli)</span>
                  <span className="font-medium">{formatCurrency(data.inventory.totalStockValue)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Nilai Stok (Harga Jual)</span>
                  <span className="font-medium">{formatCurrency(data.inventory.totalSellingValue)}</span>
                </div>
                <div className="flex justify-between items-center border-t pt-2">
                  <span className="text-sm font-medium text-gray-700">Potensi Keuntungan</span>
                  <span className="font-bold text-green-600">
                    {formatCurrency(data.inventory.potentialProfit)}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Top Customers */}
        <Card>
          <CardHeader>
            <CardTitle>Top 5 Customer</CardTitle>
          </CardHeader>
          <CardContent>
            {data.topCustomers.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">Belum ada data penjualan</p>
            ) : (
              <div className="space-y-4">
                {data.topCustomers.map((customer, index) => (
                  <div key={customer.customerCode} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm font-bold text-blue-700">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{customer.customerName}</p>
                        <p className="text-xs text-gray-500">
                          {CUSTOMER_TYPE_LABELS[customer.customerType] || customer.customerType} &middot;{' '}
                          {customer.orderCount} order
                        </p>
                      </div>
                    </div>
                    <span className="font-medium text-sm">{formatCurrency(customer.totalRevenue)}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Top Selling Items */}
        <Card>
          <CardHeader>
            <CardTitle>Top 5 Item Terlaris</CardTitle>
          </CardHeader>
          <CardContent>
            {data.topItems.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">Belum ada data penjualan</p>
            ) : (
              <div className="space-y-4">
                {data.topItems.map((item, index) => (
                  <div key={item.itemCode} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-sm font-bold text-green-700">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{item.itemName}</p>
                        <p className="text-xs text-gray-500">
                          {item.category} &middot; {item.totalQty} {item.baseUnit} terjual
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-sm">{formatCurrency(item.totalRevenue)}</p>
                      <p className="text-xs text-green-600">Profit: {formatCurrency(item.totalProfit)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Orders */}
        <Card>
          <CardHeader>
            <CardTitle>Order Terbaru</CardTitle>
          </CardHeader>
          <CardContent>
            {data.recentOrders.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">Belum ada sales order</p>
            ) : (
              <div className="space-y-4">
                {data.recentOrders.map((order) => (
                  <div key={order.soNumber} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm font-mono">{order.soNumber}</p>
                      <p className="text-xs text-gray-500">
                        {order.customerName} &middot; {formatDate(order.soDate)}
                      </p>
                    </div>
                    <div className="text-right flex items-center gap-3">
                      <span className="font-medium text-sm">{formatCurrency(order.grandTotal)}</span>
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${STATUS_COLORS[order.status] || 'bg-gray-100 text-gray-800'}`}
                      >
                        {STATUS_LABELS[order.status] || order.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
