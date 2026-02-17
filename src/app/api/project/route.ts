import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function GET() {
  return NextResponse.json({ message: 'API /api/project is reachable (GET)' })
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    console.log('[API] Create Project - Session:', session)

    if (!session || !session.user?.email) {
      console.log('[API] Create Project - Unauthorized')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { geometry, name, description, clientName, address, countryId, province, city } = body

    if (!geometry) {
      return NextResponse.json(
        { error: 'Missing required fields: geometry' },
        { status: 400 }
      )
    }

    if (!countryId) {
      return NextResponse.json(
        { error: 'Missing required fields: countryId' },
        { status: 400 }
      )
    }

    // Find user by email from session
    console.log('[API] Create Project - Looking up user:', session.user.email)
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })
    console.log('[API] Create Project - Found user:', user)

    if (!user) {
      console.log('[API] Create Project - User not found in DB')
      return NextResponse.json({ error: 'User not found in DB' }, { status: 404 })
    }

    // Create project
    const project = await prisma.project.create({
      data: {
        userId: user.id,
        geometry: JSON.stringify(geometry),
        name: name || 'Untitled Project',
        description,
        clientName,
        address,
        province,
        city,
        countryId,
        isUnlocked: false
      }
    })

    return NextResponse.json({
      success: true,
      projectId: project.id,
      userId: user.id
    })
  } catch (error) {
    console.error('Project creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create project', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
