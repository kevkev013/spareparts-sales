import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { DEFAULT_ROLES } from '../lib/permissions'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // Seed Roles
  console.log('Creating roles...')
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

  // Seed Admin User
  console.log('Creating admin user...')
  const adminRole = await prisma.role.findUnique({ where: { name: 'Admin' } })
  if (adminRole) {
    const passwordHash = await bcrypt.hash('admin123', 12)
    await prisma.user.upsert({
      where: { username: 'admin' },
      update: {},
      create: {
        username: 'admin',
        passwordHash,
        fullName: 'Administrator',
        roleId: adminRole.id,
        isActive: true,
      },
    })
  }

  // Seed Tax Master
  console.log('Creating tax rates...')
  await prisma.taxMaster.createMany({
    data: [
      {
        taxCode: 'PPN-11',
        taxName: 'PPN 11%',
        taxRate: 11.00,
        taxType: 'exclusive',
        isDefault: false,
        effectiveFrom: new Date('2022-04-01'),
        effectiveTo: new Date('2024-12-31'),
        isActive: false,
      },
      {
        taxCode: 'PPN-12',
        taxName: 'PPN 12%',
        taxRate: 12.00,
        taxType: 'exclusive',
        isDefault: true,
        effectiveFrom: new Date('2025-01-01'),
        effectiveTo: null,
        isActive: true,
      },
      {
        taxCode: 'NON-TAX',
        taxName: 'Non-Taxable',
        taxRate: 0.00,
        taxType: 'exclusive',
        isDefault: false,
        effectiveFrom: new Date('2020-01-01'),
        effectiveTo: null,
        isActive: true,
      },
    ],
    skipDuplicates: true,
  })

  // Seed Storage Locations
  console.log('Creating storage locations...')
  await prisma.location.createMany({
    data: [
      {
        locationCode: 'GD-A1',
        locationName: 'Gudang A - Rak 1',
        warehouse: 'Gudang Utama',
        zone: 'storage',
        description: 'Rak penyimpanan untuk oli dan filter',
      },
      {
        locationCode: 'GD-A2',
        locationName: 'Gudang A - Rak 2',
        warehouse: 'Gudang Utama',
        zone: 'storage',
        description: 'Rak penyimpanan untuk kampas rem dan bearing',
      },
      {
        locationCode: 'GD-B1',
        locationName: 'Gudang B - Rak 1',
        warehouse: 'Gudang Utama',
        zone: 'storage',
        description: 'Rak penyimpanan untuk suku cadang besar',
      },
      {
        locationCode: 'SHP-01',
        locationName: 'Area Shipping',
        warehouse: 'Gudang Utama',
        zone: 'shipping',
        description: 'Area untuk barang siap kirim',
      },
    ],
    skipDuplicates: true,
  })

  // Seed Sample Customers
  console.log('Creating sample customers...')
  await prisma.customer.createMany({
    data: [
      {
        customerCode: 'CUS-0001',
        customerName: 'Bengkel Jaya Motor',
        customerType: 'bengkel',
        phone: '081234567890',
        email: 'bengkeljaya@example.com',
        address: 'Jl. Merdeka No. 123',
        city: 'Jakarta',
        discountRate: 5.00,
        creditLimit: 10000000,
        creditTerm: 30,
        isTaxable: true,
      },
      {
        customerCode: 'CUS-0002',
        customerName: 'Toko Sparepart Makmur',
        customerType: 'wholesale',
        phone: '081234567891',
        email: 'makmur@example.com',
        address: 'Jl. Sudirman No. 456',
        city: 'Bandung',
        discountRate: 10.00,
        creditLimit: 25000000,
        creditTerm: 45,
        isTaxable: true,
      },
      {
        customerCode: 'CUS-0003',
        customerName: 'Budi Santoso',
        customerType: 'retail',
        phone: '081234567892',
        email: 'budi@example.com',
        address: 'Jl. Ahmad Yani No. 789',
        city: 'Surabaya',
        discountRate: 0.00,
        creditLimit: 0,
        creditTerm: 0,
        isTaxable: false,
      },
    ],
    skipDuplicates: true,
  })

  // Seed Sample Items
  console.log('Creating sample items...')
  const item1 = await prisma.item.create({
    data: {
      itemCode: 'SPR-0001',
      itemName: 'Oli Mesin Shell Helix HX7 10W-40',
      category: 'Oli Mesin',
      brand: 'Shell',
      baseUnit: 'liter',
      basePrice: 85000,
      sellingPrice: 110000,
      minStock: 50,
      description: 'Oli mesin semi-synthetic untuk motor sport dan matic',
      compatibleMotors: ['Honda Beat', 'Yamaha NMAX', 'Honda PCX'],
      isTaxable: true,
    },
  })

  const item2 = await prisma.item.create({
    data: {
      itemCode: 'SPR-0002',
      itemName: 'Kampas Rem Depan Honda Beat',
      category: 'Kampas Rem',
      brand: 'Honda',
      baseUnit: 'pcs',
      basePrice: 35000,
      sellingPrice: 50000,
      minStock: 20,
      description: 'Kampas rem depan original Honda Beat',
      compatibleMotors: ['Honda Beat', 'Honda Scoopy'],
      isTaxable: true,
    },
  })

  const item3 = await prisma.item.create({
    data: {
      itemCode: 'SPR-0003',
      itemName: 'Busi NGK Iridium',
      category: 'Busi',
      brand: 'NGK',
      baseUnit: 'pcs',
      basePrice: 45000,
      sellingPrice: 65000,
      minStock: 30,
      description: 'Busi iridium untuk performa maksimal',
      compatibleMotors: ['Universal'],
      isTaxable: true,
    },
  })

  // Add unit conversions for item1 (Oli)
  console.log('Creating unit conversions...')
  await prisma.unitConversion.createMany({
    data: [
      {
        itemCode: 'SPR-0001',
        fromUnit: 'galon',
        toUnit: 'liter',
        conversionFactor: 4,
      },
      {
        itemCode: 'SPR-0002',
        fromUnit: 'set',
        toUnit: 'pcs',
        conversionFactor: 2,
      },
      {
        itemCode: 'SPR-0003',
        fromUnit: 'box',
        toUnit: 'pcs',
        conversionFactor: 10,
      },
    ],
    skipDuplicates: true,
  })

  // Add unit prices
  console.log('Creating unit prices...')
  await prisma.unitPrice.createMany({
    data: [
      {
        itemCode: 'SPR-0001',
        unit: 'liter',
        buyingPrice: 85000,
        sellingPrice: 110000,
        minQty: 1,
      },
      {
        itemCode: 'SPR-0001',
        unit: 'galon',
        buyingPrice: 320000,
        sellingPrice: 420000,
        minQty: 1,
      },
      {
        itemCode: 'SPR-0002',
        unit: 'pcs',
        buyingPrice: 35000,
        sellingPrice: 50000,
        minQty: 1,
      },
      {
        itemCode: 'SPR-0002',
        unit: 'set',
        buyingPrice: 65000,
        sellingPrice: 95000,
        minQty: 1,
      },
      {
        itemCode: 'SPR-0003',
        unit: 'pcs',
        buyingPrice: 45000,
        sellingPrice: 65000,
        minQty: 1,
      },
      {
        itemCode: 'SPR-0003',
        unit: 'pcs',
        buyingPrice: 45000,
        sellingPrice: 60000,
        minQty: 10,
      },
    ],
    skipDuplicates: true,
  })

  // Create batches
  console.log('Creating batches...')
  const batch1 = await prisma.batch.create({
    data: {
      batchNumber: 'BTH-20250115-001',
      itemCode: 'SPR-0001',
      purchaseDate: new Date('2025-01-15'),
      purchasePrice: 85000,
      supplier: 'PT Shell Indonesia',
      characteristics: {
        grade: 'A',
        origin: 'Indonesia',
        production_year: '2024',
      },
    },
  })

  const batch2 = await prisma.batch.create({
    data: {
      batchNumber: 'BTH-20250115-002',
      itemCode: 'SPR-0002',
      purchaseDate: new Date('2025-01-15'),
      purchasePrice: 35000,
      supplier: 'PT Astra Honda Motor',
      characteristics: {
        grade: 'Original',
        warranty_months: 6,
      },
    },
  })

  // Create initial stock
  console.log('Creating initial stock...')
  await prisma.stock.createMany({
    data: [
      {
        itemCode: 'SPR-0001',
        locationCode: 'GD-A1',
        batchNumber: 'BTH-20250115-001',
        quantity: 100,
        reservedQty: 0,
        availableQty: 100,
      },
      {
        itemCode: 'SPR-0002',
        locationCode: 'GD-A2',
        batchNumber: 'BTH-20250115-002',
        quantity: 50,
        reservedQty: 0,
        availableQty: 50,
      },
    ],
    skipDuplicates: true,
  })

  console.log('✅ Seeding completed!')
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
