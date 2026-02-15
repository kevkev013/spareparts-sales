export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Package, Users, ShoppingCart, DollarSign, AlertTriangle } from 'lucide-react'
import { prisma } from '@/lib/prisma'

async function getDashboardData() {
  // Get total items
  const totalItems = await prisma.item.count({
    where: { isActive: true },
  })

  // Get total customers
  const totalCustomers = await prisma.customer.count({
    where: { isActive: true },
  })

  // Get low stock items
  const lowStockItems = await prisma.item.findMany({
    where: {
      isActive: true,
    },
    include: {
      stocks: {
        select: {
          quantity: true,
        },
      },
    },
  })

  const itemsLowStock = lowStockItems.filter((item) => {
    const totalStock = item.stocks.reduce((sum, stock) => sum + Number(stock.quantity), 0)
    return totalStock <= item.minStock
  })

  // Get total stock value
  const items = await prisma.item.findMany({
    where: { isActive: true },
    include: {
      stocks: {
        select: {
          quantity: true,
        },
      },
    },
  })

  const totalStockValue = items.reduce((sum, item) => {
    const totalStock = item.stocks.reduce((acc, stock) => acc + Number(stock.quantity), 0)
    return sum + totalStock * Number(item.basePrice)
  }, 0)

  return {
    totalItems,
    totalCustomers,
    lowStockCount: itemsLowStock.length,
    totalStockValue,
    lowStockItems: itemsLowStock.slice(0, 5).map((item) => ({
      id: item.id,
      itemCode: item.itemCode,
      itemName: item.itemName,
      minStock: item.minStock,
      totalStock: item.stocks.reduce((sum, stock) => sum + Number(stock.quantity), 0),
      baseUnit: item.baseUnit,
    })),
  }
}

export default async function DashboardPage() {
  const data = await getDashboardData()

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
        <p className="text-gray-600">Selamat datang di Sistem Inventory Sparepart Motor</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Items
            </CardTitle>
            <Package className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.totalItems}</div>
            <p className="text-xs text-gray-600 mt-1">Sparepart aktif</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Customers
            </CardTitle>
            <Users className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.totalCustomers}</div>
            <p className="text-xs text-gray-600 mt-1">Customer aktif</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Stok Menipis
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{data.lowStockCount}</div>
            <p className="text-xs text-gray-600 mt-1">Item di bawah minimum</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Nilai Stok
            </CardTitle>
            <DollarSign className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat('id-ID', {
                style: 'currency',
                currency: 'IDR',
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              }).format(data.totalStockValue)}
            </div>
            <p className="text-xs text-gray-600 mt-1">Total nilai inventory</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link href="/master/items/create">
              <Button className="w-full" variant="outline">
                <Package className="h-4 w-4 mr-2" />
                Tambah Item
              </Button>
            </Link>
            <Link href="/master/customers">
              <Button className="w-full" variant="outline">
                <Users className="h-4 w-4 mr-2" />
                Kelola Customer
              </Button>
            </Link>
            <Link href="/sales/orders">
              <Button className="w-full" variant="outline">
                <ShoppingCart className="h-4 w-4 mr-2" />
                Buat Sales Order
              </Button>
            </Link>
            <Link href="/reports">
              <Button className="w-full" variant="outline">
                <DollarSign className="h-4 w-4 mr-2" />
                Lihat Laporan
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Low Stock Alert */}
      {data.lowStockCount > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Stok Menipis</CardTitle>
              <Link href="/master/items">
                <Button variant="link" size="sm">
                  Lihat Semua
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.lowStockItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-4 bg-red-50 rounded-lg"
                >
                  <div>
                    <p className="font-medium">{item.itemName}</p>
                    <p className="text-sm text-gray-600 font-mono">{item.itemCode}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-red-600 font-bold">
                      {item.totalStock} {item.baseUnit}
                    </p>
                    <p className="text-sm text-gray-600">Min: {item.minStock}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
