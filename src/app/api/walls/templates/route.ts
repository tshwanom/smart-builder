import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const projectId = searchParams.get('projectId')
    const countryCode = searchParams.get('countryCode') || 'ZA' // Default to South Africa

    // Fetch System Templates for the Country + Project Specific Templates
    const templates = await prisma.wallTemplate.findMany({
      where: {
        country: {
          code: countryCode
        },
        OR: [
          { isSystem: true },
          { projectId: projectId || '' },
          { projectId: null }
        ]
      },
      include: {
        layers: {
          orderBy: { sortOrder: 'asc' },
          include: {
            material: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    })

    return NextResponse.json(templates)
  } catch (error) {
    console.error('Error fetching wall templates:', error)
    return NextResponse.json({ error: 'Failed to fetch templates' }, { status: 500 })
  }
}


interface LayerInput {
  type: string
  thickness: number | string
  isStructural: boolean
  materialId?: string | null
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, description, hatchPattern, fillColor, projectId, countryCode, layers } = body

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    const template = await prisma.wallTemplate.create({
      data: {
        name,
        description: description || '',
        hatchPattern: hatchPattern || 'SOLID',
        fillColor: fillColor || '#cccccc',
        isSystem: false,
        ...(projectId ? { projectId } : {}), // Only include if truthy
        country: {
          connect: { code: countryCode || 'ZA' } // Default/Fallback
        },
        layers: {
          create: layers.map((layer: LayerInput, index: number) => ({
            type: layer.type,
            thickness: Number(layer.thickness) || 0,
            isStructural: layer.isStructural,
            sortOrder: index,
            materialId: layer.materialId || null
          }))
        }
      },
      include: {
        layers: {
          include: { material: true },
          orderBy: { sortOrder: 'asc' }
        }
      }
    })

    return NextResponse.json(template)
  } catch (error) {
    console.error('Error creating wall template:', error)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return NextResponse.json({ error: (error as any).message || 'Failed to create template' }, { status: 500 })
  }
}
