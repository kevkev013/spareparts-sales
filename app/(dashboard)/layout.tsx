import Link from 'next/link'
import { Package, Users, MapPin, LayoutDashboard, FileText, DollarSign, RotateCcw, Settings } from 'lucide-react'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    {
      name: 'Master Data',
      icon: Package,
      children: [
        { name: 'Items (Sparepart)', href: '/master/items' },
        { name: 'Customers', href: '/master/customers' },
        { name: 'Locations', href: '/master/locations' },
        { name: 'Batches', href: '/master/batches' },
      ],
    },
    {
      name: 'Sales',
      icon: FileText,
      children: [
        { name: 'Quotations', href: '/sales/quotations' },
        { name: 'Sales Orders', href: '/sales/orders' },
        { name: 'Delivery Orders', href: '/sales/delivery-orders' },
        { name: 'Shipments', href: '/sales/shipments' },
        { name: 'Invoices', href: '/sales/invoices' },
      ],
    },
    { name: 'Payments', href: '/payments', icon: DollarSign },
    { name: 'Returns', href: '/returns', icon: RotateCcw },
    { name: 'Settings', href: '/settings', icon: Settings },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-xl font-bold text-blue-600">
              Sparepart Inventory
            </Link>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">Admin</span>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-white border-r min-h-[calc(100vh-73px)] sticky top-[73px]">
          <nav className="p-4 space-y-2">
            {navigation.map((item) => (
              <div key={item.name}>
                {item.href ? (
                  <Link
                    href={item.href}
                    className="flex items-center gap-3 px-3 py-2 text-gray-700 rounded-lg hover:bg-gray-100 transition"
                  >
                    <item.icon className="h-5 w-5" />
                    <span>{item.name}</span>
                  </Link>
                ) : (
                  <>
                    <div className="flex items-center gap-3 px-3 py-2 text-gray-900 font-medium">
                      <item.icon className="h-5 w-5" />
                      <span>{item.name}</span>
                    </div>
                    {item.children && (
                      <div className="ml-8 mt-1 space-y-1">
                        {item.children.map((child) => (
                          <Link
                            key={child.name}
                            href={child.href}
                            className="block px-3 py-2 text-sm text-gray-600 rounded-lg hover:bg-gray-100 transition"
                          >
                            {child.name}
                          </Link>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            ))}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  )
}
