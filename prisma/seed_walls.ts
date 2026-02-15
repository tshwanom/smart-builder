import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🧱 Seeding Wall Templates & Materials...')

  // 1. Get Country (South Africa)
  const za = await prisma.country.findUnique({ where: { code: 'ZA' } })
  if (!za) {
    console.error('❌ South Africa not found. Run main seed first.')
    return
  }

  // 2. Define Materials
  const materials = [
    {
      id: 'mat-brick-stock-cement',
      name: 'Cement Stock Brick',
      category: 'brick',
      lengthMm: 222, widthMm: 106, heightMm: 73,
      description: 'Standard cement stock brick',
    },
    {
      id: 'mat-brick-stock-clay',
      name: 'Clay Stock Brick',
      category: 'brick',
      lengthMm: 222, widthMm: 106, heightMm: 73,
      description: 'Standard clay stock brick',
    },
    {
      id: 'mat-brick-face-red',
      name: 'Red Face Brick',
      category: 'brick',
      lengthMm: 222, widthMm: 106, heightMm: 73,
      description: 'Standard red face brick',
    },
    {
      id: 'mat-brick-maxi',
      name: 'Maxi Brick',
      category: 'block',
      lengthMm: 290, widthMm: 140, heightMm: 90,
      description: 'Large format maxi brick',
    },
    {
      id: 'mat-finish-plaster',
      name: 'Plaster (Sand/Cement)',
      category: 'finish',
      description: 'Standard internal/external plaster',
    },
    {
        id: 'mat-finish-paint',
        name: 'Paint (Acrylic)',
        category: 'finish',
        description: 'Standard acrylic paint',
    }
  ]

  // Upsert Materials
  for (const mat of materials) {
    await prisma.material.upsert({
      where: { id: mat.id },
      update: {
        lengthMm: mat.lengthMm,
        widthMm: mat.widthMm,
        heightMm: mat.heightMm,
      },
      create: {
        id: mat.id,
        countryId: za.id,
        name: mat.name,
        category: mat.category,
        lengthMm: mat.lengthMm,
        widthMm: mat.widthMm,
        heightMm: mat.heightMm,
        specifications: '{}'
      }
    })
  }

  // 3. Define Templates
  const templates = [
    {
      name: '115mm Single Skin',
      description: 'Standard single skin stock brick wall',
      hatchPattern: 'DIAGONAL',
      fillColor: '#A0A0A0',
      layers: [
        { type: 'MASONRY', materialId: 'mat-brick-stock-cement', thickness: 110, isStructural: true, sortOrder: 0 },
        { type: 'FINISH', materialId: 'mat-finish-plaster', thickness: 15, isStructural: false, sortOrder: 1 },
        { type: 'FINISH', materialId: 'mat-finish-paint', thickness: 0, isStructural: false, sortOrder: 2 },
         { type: 'FINISH', materialId: 'mat-finish-plaster', thickness: 15, isStructural: false, sortOrder: -1 },
        { type: 'FINISH', materialId: 'mat-finish-paint', thickness: 0, isStructural: false, sortOrder: -2 },
      ]
    },
    {
      name: 'Maxi Brick Wall (140mm)',
      description: 'Single skin maxi brick wall',
      hatchPattern: 'CROSSHATCH',
      fillColor: '#E0E0E0',
      layers: [
        { type: 'MASONRY', materialId: 'mat-brick-maxi', thickness: 140, isStructural: true, sortOrder: 0 }
      ]
    },
    {
      name: '230mm Double Skin',
      description: 'Standard double skin stock brick wall (Plastered)',
      hatchPattern: 'DIAGONAL',
      fillColor: '#A0A0A0',
      layers: [
        { type: 'MASONRY', materialId: 'mat-brick-stock-cement', thickness: 110, isStructural: true, sortOrder: 0 },
        { type: 'MASONRY', materialId: 'mat-brick-stock-cement', thickness: 110, isStructural: true, sortOrder: 1 },
        { type: 'FINISH', materialId: 'mat-finish-plaster', thickness: 15, isStructural: false, sortOrder: 2 }, // Internal
        { type: 'FINISH', materialId: 'mat-finish-plaster', thickness: 15, isStructural: false, sortOrder: -1 } // External
      ]
    },
    {
      name: '230mm Face Brick (Both Sides)',
      description: 'Double skin face brick, no plaster',
      hatchPattern: 'SOLID',
      fillColor: '#8B4513',
      layers: [
        { type: 'MASONRY', materialId: 'mat-brick-face-red', thickness: 110, isStructural: true, sortOrder: 0 },
        { type: 'MASONRY', materialId: 'mat-brick-face-red', thickness: 110, isStructural: true, sortOrder: 1 }
      ]
    },
    {
        name: '230mm Face Brick External',
        description: 'Face brick outside, Stock brick inside (Plastered)',
        hatchPattern: 'SOLID',
        fillColor: '#8B4513',
        layers: [
          { type: 'MASONRY', materialId: 'mat-brick-face-red', thickness: 110, isStructural: true, sortOrder: 0 }, // External
          { type: 'MASONRY', materialId: 'mat-brick-stock-cement', thickness: 110, isStructural: true, sortOrder: 1 }, // Internal
          { type: 'FINISH', materialId: 'mat-finish-plaster', thickness: 15, isStructural: false, sortOrder: 2 } // Internal Plaster
        ]
      }
  ]

  // Upsert Templates
  for (const t of templates) {
    // Check if exists by name to avoid dupes (rough check)
    const existing = await prisma.wallTemplate.findFirst({
        where: { name: t.name, countryId: za.id }
    })

    if (!existing) {
        console.log(`Creating template: ${t.name}`)
        await prisma.wallTemplate.create({
            data: {
                name: t.name,
                description: t.description,
                countryId: za.id,
                isSystem: true,
                hatchPattern: t.hatchPattern,
                fillColor: t.fillColor,
                layers: {
                    create: t.layers.map(l => ({
                        type: l.type,
                        thickness: l.thickness,
                        isStructural: l.isStructural,
                        sortOrder: l.sortOrder,
                        materialId: l.materialId
                    }))
                }
            }
        })
    } else {
        console.log(`Template ${t.name} already exists. Skipping.`)
    }
  }

  // Set Project Default (Update all existing projects to use Cement Stock if not set)
  await prisma.project.updateMany({
      where: { defaultBrickMaterialId: null },
      data: { defaultBrickMaterialId: 'mat-brick-stock-cement' }
  })

  console.log('✅ Wall seeding complete!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
