export const PERMISSION_MODULES = [
  {
    module: 'dashboard',
    label: 'Dashboard',
    actions: ['view'],
  },
  {
    module: 'items',
    label: 'Master Item',
    actions: ['view', 'create', 'edit', 'delete'],
  },
  {
    module: 'customers',
    label: 'Master Customer',
    actions: ['view', 'create', 'edit', 'delete'],
  },
  {
    module: 'locations',
    label: 'Master Lokasi',
    actions: ['view', 'create', 'edit', 'delete'],
  },
  {
    module: 'batches',
    label: 'Master Batch',
    actions: ['view', 'create', 'edit', 'delete'],
  },
  {
    module: 'quotations',
    label: 'Quotation',
    actions: ['view', 'create', 'edit', 'delete', 'print', 'approve'],
  },
  {
    module: 'orders',
    label: 'Sales Order',
    actions: ['view', 'create', 'edit', 'delete', 'print'],
  },
  {
    module: 'delivery_orders',
    label: 'Delivery Order',
    actions: ['view', 'create', 'edit', 'print'],
  },
  {
    module: 'shipments',
    label: 'Shipment / Surat Jalan',
    actions: ['view', 'create', 'edit', 'print'],
  },
  {
    module: 'invoices',
    label: 'Invoice',
    actions: ['view', 'create', 'print'],
  },
  {
    module: 'payments',
    label: 'Pembayaran',
    actions: ['view', 'create', 'edit', 'print'],
  },
  {
    module: 'returns',
    label: 'Retur',
    actions: ['view', 'create', 'edit', 'delete', 'approve'],
  },
  {
    module: 'reports',
    label: 'Laporan',
    actions: ['view'],
  },
  {
    module: 'users',
    label: 'Manajemen User',
    actions: ['view', 'create', 'edit', 'delete'],
  },
  {
    module: 'roles',
    label: 'Manajemen Role',
    actions: ['view', 'create', 'edit', 'delete'],
  },
] as const

export const ACTION_LABELS: Record<string, string> = {
  view: 'Lihat',
  create: 'Tambah',
  edit: 'Edit',
  delete: 'Hapus',
  print: 'Cetak',
  approve: 'Approve',
}

export const ALL_ACTIONS = ['view', 'create', 'edit', 'delete', 'print', 'approve'] as const

export function getAllPermissionKeys(): string[] {
  return PERMISSION_MODULES.flatMap((m) => m.actions.map((a) => `${m.module}.${a}`))
}

function buildAllTrue(): Record<string, boolean> {
  const perms: Record<string, boolean> = {}
  for (const key of getAllPermissionKeys()) {
    perms[key] = true
  }
  return perms
}

function buildPermissions(keys: string[]): Record<string, boolean> {
  const perms: Record<string, boolean> = {}
  for (const key of keys) {
    perms[key] = true
  }
  return perms
}

export const DEFAULT_ROLES = [
  {
    name: 'Admin',
    description: 'Akses penuh ke semua fitur',
    isSystem: true,
    permissions: buildAllTrue(),
  },
  {
    name: 'Manager',
    description: 'Melihat semua data, approve, laporan',
    isSystem: false,
    permissions: buildPermissions([
      'dashboard.view',
      'items.view',
      'customers.view',
      'locations.view',
      'batches.view',
      'quotations.view',
      'quotations.approve',
      'quotations.print',
      'orders.view',
      'orders.print',
      'delivery_orders.view',
      'delivery_orders.print',
      'shipments.view',
      'shipments.print',
      'invoices.view',
      'invoices.print',
      'payments.view',
      'payments.print',
      'returns.view',
      'returns.approve',
      'reports.view',
    ]),
  },
  {
    name: 'Sales',
    description: 'Quotation, Sales Order, Customer',
    isSystem: false,
    permissions: buildPermissions([
      'dashboard.view',
      'items.view',
      'customers.view',
      'customers.create',
      'customers.edit',
      'quotations.view',
      'quotations.create',
      'quotations.edit',
      'quotations.delete',
      'quotations.print',
      'orders.view',
      'orders.create',
      'orders.edit',
      'orders.print',
      'invoices.view',
      'invoices.print',
      'reports.view',
    ]),
  },
  {
    name: 'Gudang',
    description: 'Delivery Order, Shipment, Stok',
    isSystem: false,
    permissions: buildPermissions([
      'dashboard.view',
      'items.view',
      'locations.view',
      'batches.view',
      'batches.create',
      'batches.edit',
      'orders.view',
      'delivery_orders.view',
      'delivery_orders.create',
      'delivery_orders.edit',
      'delivery_orders.print',
      'shipments.view',
      'shipments.create',
      'shipments.edit',
      'shipments.print',
      'returns.view',
      'returns.edit',
    ]),
  },
  {
    name: 'Finance',
    description: 'Invoice, Payment, Laporan Keuangan',
    isSystem: false,
    permissions: buildPermissions([
      'dashboard.view',
      'customers.view',
      'invoices.view',
      'invoices.create',
      'invoices.print',
      'payments.view',
      'payments.create',
      'payments.edit',
      'payments.print',
      'returns.view',
      'returns.approve',
      'reports.view',
    ]),
  },
  {
    name: 'Viewer',
    description: 'Hanya bisa melihat data',
    isSystem: false,
    permissions: buildPermissions([
      'dashboard.view',
      'items.view',
      'customers.view',
      'locations.view',
      'batches.view',
      'quotations.view',
      'orders.view',
      'delivery_orders.view',
      'shipments.view',
      'invoices.view',
      'payments.view',
      'returns.view',
      'reports.view',
    ]),
  },
]
