import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌍 Seeding multi-country data...')

  // Create South Africa
  const southAfrica = await prisma.country.upsert({
    where: { code: 'ZA' },
    update: {},
    create: {
      code: 'ZA',
      name: 'South Africa',
      currency: 'ZAR',
      currencySymbol: 'R',
      buildingCode: 'SANS 10400',
      active: true,
    },
  })

  console.log('✅ Created country: South Africa')

  // Create South African Materials
  const materials = [
    // Bricks
    {
      countryId: southAfrica.id,
      category: 'brick',
      name: 'Clay Stock Brick',
      specifications: JSON.stringify({
        dimensions: { length: 220, width: 106, height: 73 },
        unit: 'mm',
      }),
      unitsPerM2: 55,
      mortarRatio: '1:4',
      description: 'Standard clay stock brick for load-bearing walls',
    },
    {
      countryId: southAfrica.id,
      category: 'brick',
      name: 'Cement Stock Brick',
      specifications: JSON.stringify({
        dimensions: { length: 220, width: 106, height: 73 },
        unit: 'mm',
      }),
      unitsPerM2: 55,
      mortarRatio: '1:4',
      description: 'Cement stock brick for load-bearing walls',
    },
    {
      countryId: southAfrica.id,
      category: 'brick',
      name: 'Face Brick',
      specifications: JSON.stringify({
        dimensions: { length: 220, width: 106, height: 73 },
        unit: 'mm',
      }),
      unitsPerM2: 55,
      mortarRatio: '1:4',
      description: 'Face brick for exterior walls (no plaster required)',
    },
    // Blocks
    {
      countryId: southAfrica.id,
      category: 'block',
      name: 'Concrete Block (140mm)',
      specifications: JSON.stringify({
        dimensions: { length: 390, width: 190, height: 140 },
        unit: 'mm',
      }),
      unitsPerM2: 12.5,
      mortarRatio: '1:6',
      description: 'Standard 140mm concrete block',
    },
    {
      countryId: southAfrica.id,
      category: 'block',
      name: 'Concrete Block (190mm)',
      specifications: JSON.stringify({
        dimensions: { length: 390, width: 190, height: 190 },
        unit: 'mm',
      }),
      unitsPerM2: 12.5,
      mortarRatio: '1:6',
      description: 'Heavy-duty 190mm concrete block',
    },
    // Roofing
    {
      countryId: southAfrica.id,
      category: 'roofing',
      name: 'IBR Sheeting',
      specifications: JSON.stringify({
        coverage: 0.685,
        unit: 'm per sheet',
        length: '3m, 4m, 5m, 6m',
      }),
      unitsPerM2: 1.46,
      description: 'Corrugated IBR roof sheeting',
    },
    {
      countryId: southAfrica.id,
      category: 'roofing',
      name: 'Corrugated Sheeting',
      specifications: JSON.stringify({
        coverage: 0.762,
        unit: 'm per sheet',
        length: '3m, 4m, 5m, 6m',
      }),
      unitsPerM2: 1.31,
      description: 'Standard corrugated roof sheeting',
    },
    {
      countryId: southAfrica.id,
      category: 'roofing',
      name: 'Concrete Roof Tile',
      specifications: JSON.stringify({
        coverage: 9.5,
        unit: 'tiles per m²',
      }),
      unitsPerM2: 9.5,
      description: 'Concrete roof tiles',
    },
    // Slabs
    {
      countryId: southAfrica.id,
      category: 'slab',
      name: 'In-situ Concrete Slab',
      specifications: JSON.stringify({
        thickness: [100, 125, 150, 175, 200],
        unit: 'mm',
        reinforcement: 'Y12@200 B/W',
      }),
      description: 'Cast in-situ concrete slab',
    },
    {
      countryId: southAfrica.id,
      category: 'slab',
      name: 'Rib & Block Slab',
      specifications: JSON.stringify({
        thickness: [175, 200, 225],
        unit: 'mm',
        blocks: 'Polystyrene or concrete blocks',
      }),
      description: 'Rib and block suspended slab',
    },
    {
      countryId: southAfrica.id,
      category: 'slab',
      name: 'Prestressed Planks',
      specifications: JSON.stringify({
        thickness: [110, 150, 200],
        unit: 'mm',
        width: 1200,
      }),
      description: 'Prestressed concrete planks',
    },
  ]

  for (const material of materials) {
    await prisma.material.upsert({
      where: {
        id: `${southAfrica.id}-${material.category}-${material.name.replace(/\s+/g, '-').toLowerCase()}`,
      },
      update: {},
      create: material,
    })
  }

  console.log(`✅ Created ${materials.length} materials for South Africa`)

  // Create Pricing Tiers for South Africa
  const pricingTiers = [
    { minArea: 0, maxArea: 50, pricePerM2: 15 },
    { minArea: 51, maxArea: 100, pricePerM2: 12 },
    { minArea: 101, maxArea: 200, pricePerM2: 10 },
    { minArea: 201, maxArea: 500, pricePerM2: 8 },
    { minArea: 501, maxArea: null, pricePerM2: 6 },
  ]

  for (const tier of pricingTiers) {
    await prisma.pricingTier.create({
      data: {
        countryId: southAfrica.id,
        ...tier,
      },
    })
  }

  console.log(`✅ Created ${pricingTiers.length} pricing tiers for South Africa`)
  console.log('🎉 Seeding complete!')
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
