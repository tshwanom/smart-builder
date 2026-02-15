
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> } // Params are async in Next.js 15+ but let's conform to standard
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params // Await params just in case

    const body = await request.json()
    console.log('API: PATCH received for project', id)
    if (body.geometry) console.log('API: Geometry size:', JSON.stringify(body.geometry).length)

    const { geometry, province, city } = body

    if (!geometry && !province && !city) {
      return NextResponse.json(
        { error: 'Missing update data' },
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

    // Get user id from session email (since session.user.id might not be populated in all setups)
    const user = await prisma.user.findUnique({
        where: { email: session.user.email }
    })
    
    if (!user || user.id !== project.userId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Update
    const updateData: any = { updatedAt: new Date() }
    if (geometry) updateData.geometry = JSON.stringify(geometry)
    if (province) updateData.province = province
    if (city) updateData.city = city

    const updatedProject = await prisma.project.update({
      where: { id },
      data: updateData
    })

    return NextResponse.json({ success: true, updatedAt: updatedProject.updatedAt })

  } catch (error) {
    console.error('Project update error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to update project', 
        details: error instanceof Error ? error.message : String(error) 
      },
      { status: 500 }
    )
  }
}

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        console.log('API: GET /api/project/[id] - Start')
        const session = await getServerSession(authOptions)
        console.log('API: Session:', session?.user?.email)

        if (!session || !session.user?.email) {
          console.log('API: Unauthorized')
          return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }
    
        const { id } = await params
        console.log('API: Fetching project ID:', id)
    
        const project = await prisma.project.findUnique({
          where: { id },
          include: {
            country: true
          }
        })
        console.log('API: Project found:', !!project)
    
        if (!project) {
            return NextResponse.json({ error: 'Project not found' }, { status: 404 })
        }
    
        // Get user id
        const user = await prisma.user.findUnique({
            where: { email: session.user.email }
        })
        console.log('API: User found:', !!user, user?.id)
        
        if (!user || user.id !== project.userId) {
            console.log('API: Forbidden access. User:', user?.id, 'Project Owner:', project.userId)
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }
    
        console.log('API: Returning project')
        return NextResponse.json({ project })
    
      } catch (error) {
        console.error('Project fetch error:', error)
        return NextResponse.json(
          { 
            error: 'Failed to fetch project',
            details: error instanceof Error ? error.message : String(error)
          },
          { status: 500 }
        )
      }
}
