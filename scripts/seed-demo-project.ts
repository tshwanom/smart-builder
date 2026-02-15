
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding demo project...')

  try {
    // 1. Create or find a dummy user
    const user = await prisma.user.upsert({
      where: { email: 'demo@example.com' },
      update: {},
      create: {
        email: 'demo@example.com',
        name: 'Demo User',
      }
    })
    console.log('✅ Demo user ensured:', user.id)

    // 2. Create the demo project
    // Note: Project id is a CUID by default, but weforce 'demo-project' if possible.
    // However, if the ID column is CUID, forcing a string like 'demo-project' might work if it fits the text column constraint.
    // Let's try to upsert.
    const project = await prisma.project.upsert({
      where: { id: 'demo-project' },
      update: {},
      create: {
        id: 'demo-project',
        userId: user.id,
        name: 'Demo Project',
        geometry: '{}', // Empty JSON for now
        isUnlocked: false
      }
    })

    console.log('✅ Demo project ensured:', project.id)
  } catch (error) {
    console.error('Error seeding:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()
