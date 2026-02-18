
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const products = [
  // 1. Floor Finishes (Tiles)
  {
    name: "Ceramic Floor Tile - Beige (350x350)",
    category: "FLOOR",
    type: "TILE",
    material: "CERAMIC",
    finish: "MATT",
    length: 350,
    width: 350,
    thickness: 7,
    waste: 10.0,
    price: 129.00, // R129/m2
    unit: "m2",
    specs: JSON.stringify({ slipRating: "R9", boxQty: 1.8 })
  },
  {
    name: "Porcelain Nano Polished - Ivory (600x600)",
    category: "FLOOR",
    type: "TILE",
    material: "PORCELAIN",
    finish: "GLOSS",
    length: 600,
    width: 600,
    thickness: 9,
    waste: 12.0,
    price: 249.00,
    unit: "m2",
    specs: JSON.stringify({ slipRating: "R10", boxQty: 1.44, rectified: true })
  },
  {
    name: "Laminate Flooring - Oak Grey",
    category: "FLOOR",
    type: "LAMINATE",
    material: "HDF",
    finish: "MATT",
    length: 1200,
    width: 190,
    thickness: 8,
    waste: 8.0,
    price: 189.00,
    unit: "m2",
    specs: JSON.stringify({ grade: "AC4", clickSystem: "Valinge" })
  },
  
  // 2. Wall Finishes (Paint)
  {
    name: "Masonry Primer",
    category: "WALL",
    type: "PAINT",
    material: "ACRYLIC",
    finish: "MATT",
    spreadRate: 8.0,
    waste: 5.0,
    price: 45.00, // per Liter (bulk)
    unit: "L",
    specs: JSON.stringify({ type: "PRIMER", substrate: "PLASTER" })
  },
  {
    name: "Universal Undercoat",
    category: "WALL",
    type: "PAINT",
    material: "ALKYD",
    finish: "MATT",
    spreadRate: 10.0,
    waste: 5.0,
    price: 85.00,
    unit: "L",
    specs: JSON.stringify({ type: "UNDERCOAT" })
  },
  {
    name: "Super Acrylic - White",
    category: "WALL",
    type: "PAINT",
    material: "ACRYLIC",
    finish: "MATT",
    spreadRate: 8.0,
    waste: 5.0,
    price: 75.00,
    unit: "L",
    specs: JSON.stringify({ type: "TOPCOAT", scrubbing: "Class 1" })
  },
  {
    name: "Sheen Acrylic - Dove Grey",
    category: "WALL",
    type: "PAINT",
    material: "ACRYLIC",
    finish: "SATIN",
    spreadRate: 9.0,
    waste: 5.0,
    price: 95.00,
    unit: "L",
    specs: JSON.stringify({ type: "TOPCOAT", washability: "High" })
  },

  // 3. Trim
  {
    name: "Pine Skirting (69mm)",
    category: "TRIM",
    type: "SKIRTING",
    material: "TIMBER",
    length: 3000,
    waste: 10.0,
    price: 45.00, // per meter
    unit: "m",
    specs: JSON.stringify({ profile: "BULLNOSE" })
  },
  {
    name: "Polystyrene Cornice (100mm)",
    category: "TRIM",
    type: "CORNICE",
    material: "POLYSTYRENE",
    length: 2000,
    waste: 15.0,
    price: 35.00, // per meter
    unit: "m",
    specs: JSON.stringify({ profile: "COVE" })
  }
]

async function main() {
  console.log('🌱 Starting Finish Product seeding...')
  
  for (const product of products) {
    const exists = await prisma.finishProduct.findFirst({
        where: { name: product.name }
    })
    
    if (!exists) {
        await prisma.finishProduct.create({ data: product })
        console.log(`✅ Created: ${product.name}`)
    } else {
        console.log(`⏩ Skipped (Exists): ${product.name}`)
    }
  }
  
  console.log('🏁 Seeding complete.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
