
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const countries = await prisma.country.findMany({
      where: { active: true },
      select: {
        id: true,
        name: true,
        code: true,
        currencySymbol: true
      },
      orderBy: { name: 'asc' }
    })

    return NextResponse.json({ countries })
  } catch (error) {
    console.error('Countries fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch countries' },
      { status: 500 }
    )
  }
}
