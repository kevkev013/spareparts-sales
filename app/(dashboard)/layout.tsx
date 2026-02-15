'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { usePermissions } from '@/hooks/use-permissions'
import {
  Package,
  LayoutDashboard,
  FileText,
  DollarSign,
  RotateCcw,
  Settings,
  BarChart3,
  LogOut,
  Loader2,
  KeyRound,
} from 'lucide-react'

type NavChild = {
  name: string
  href: string
  permission: string
}

type NavItem = {
  name: string
  href?: string
  icon: React.ElementType
  permission?: string
  children?: NavChild[]
}

const navigation: NavItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, permission: 'dashboard.view' },
  {
    name: 'Master Data',
    icon: Package,
    children: [
      { name: 'Items (Sparepart)', href: '/master/items', permission: 'items.view' },
      { name: 'Customers', href: '/master/customers', permission: 'customers.view' },
      { name: 'Locations', href: '/master/locations', permission: 'locations.view' },
      { name: 'Batches', href: '/master/batches', permission: 'batches.view' },
    ],
  },
  {
    name: 'Sales',
    icon: FileText,
    children: [
      { name: 'Quotations', href: '/sales/quotations', permission: 'quotations.view' },
      { name: 'Sales Orders', href: '/sales/orders', permission: 'orders.view' },
      { name: 'Delivery Orders', href: '/sales/delivery-orders', permission: 'delivery_orders.view' },
      { name: 'Shipments', href: '/sales/shipments', permission: 'shipments.view' },
      { name: 'Invoices', href: '/sales/invoices', permission: 'invoices.view' },
    ],
  },
  { name: 'Payments', href: '/payments', icon: DollarSign, permission: 'payments.view' },
  { name: 'Returns', href: '/returns', icon: RotateCcw, permission: 'returns.view' },
  { name: 'Reports', href: '/reports', icon: BarChart3, permission: 'reports.view' },
  {
    name: 'Settings',
    icon: Settings,
    children: [
      { name: 'Users', href: '/settings/users', permission: 'users.view' },
      { name: 'Roles', href: '/settings/roles', permission: 'roles.view' },
    ],
  },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { can, user, isLoading } = usePermissions()

  // Filter navigation based on permissions
  const filteredNavigation = navigation
    .map((item) => {
      if (item.children) {
        const visibleChildren = item.children.filter((child) => can(child.permission))
        if (visibleChildren.length === 0) return null
        return { ...item, children: visibleChildren }
      }
      if (item.permission && !can(item.permission)) return null
      return item
    })
    .filter(Boolean) as NavItem[]

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10 print:hidden">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/dashboard" className="text-xl font-bold text-blue-600">
              Sparepart Inventory
            </Link>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                <p className="text-xs text-gray-500">{user?.role}</p>
              </div>
              <Link
                href="/settings/change-password"
                className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                title="Ganti Password"
              >
                <KeyRound className="h-4 w-4" />
              </Link>
              <button
                onClick={() => signOut({ callbackUrl: '/login' })}
                className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                title="Keluar"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-white border-r min-h-[calc(100vh-73px)] sticky top-[73px] print:hidden">
          <nav className="p-4 space-y-2">
            {filteredNavigation.map((item) => (
              <div key={item.name}>
                {item.href ? (
                  <Link
                    href={item.href}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg transition ${
                      pathname === item.href
                        ? 'bg-blue-50 text-blue-700 font-medium'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
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
                            className={`block px-3 py-2 text-sm rounded-lg transition ${
                              pathname.startsWith(child.href)
                                ? 'bg-blue-50 text-blue-700 font-medium'
                                : 'text-gray-600 hover:bg-gray-100'
                            }`}
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
        <main className="flex-1">{children}</main>
      </div>
    </div>
  )
}
