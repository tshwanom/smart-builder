
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Verify ownership
    const project = await prisma.project.findUnique({
      where: { id },
      select: { userId: true }
    })

    if (!project) {
        return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    const user = await prisma.user.findUnique({
        where: { email: session.user.email }
    })
    
    if (!user || user.id !== project.userId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Fetch rates
    const rates = await prisma.bOQRate.findMany({
      where: { projectId: id }
    })

    return NextResponse.json({ rates })

  } catch (error) {
    console.error('BOQ Rates fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch rates' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { itemKey, rate } = body

    if (!itemKey || rate === undefined) {
      return NextResponse.json(
        { error: 'Missing itemKey or rate' },
        { status: 400 }
      )
    }

    // Verify ownership
    const project = await prisma.project.findUnique({
      where: { id },
      select: { userId: true }
    })

    if (!project) {
        return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    const user = await prisma.user.findUnique({
        where: { email: session.user.email }
    })
    
    if (!user || user.id !== project.userId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Upsert rate
    const updatedRate = await prisma.bOQRate.upsert({
      where: {
        projectId_itemKey: {
          projectId: id,
          itemKey: itemKey
        }
      },
      update: {
        rate: parseFloat(rate),
        updatedAt: new Date()
      },
      create: {
        projectId: id,
        itemKey,
        rate: parseFloat(rate)
      }
    })

    return NextResponse.json({ success: true, rate: updatedRate })

  } catch (error) {
    console.error('BOQ Rate save error:', error)
    return NextResponse.json(
      { error: 'Failed to save rate' },
      { status: 500 }
    )
  }
}
