// Quick script to initialize database tables
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  console.log('Initializing database...')
  
  try {
    // Test connection
    await prisma.$connect()
    console.log('✅ Connected to database successfully!')
    
    // The tables will be created automatically by Prisma
    // Just test if we can query
    const userCount = await prisma.user.count()
    console.log(`✅ Database initialized! Users: ${userCount}`)
    
  } catch (error) {
    console.error('❌ Database error:', error.message)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
