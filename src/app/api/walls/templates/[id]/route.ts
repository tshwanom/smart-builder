import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PUT(
  req: NextRequest, 
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const body = await req.json()
    const { name, description, hatchPattern, fillColor, layers } = body

    // Transaction: Update Template metadata and replace layers
    const updatedTemplate = await prisma.$transaction(async (tx) => {
      // 1. Update basic info
      const template = await tx.wallTemplate.update({
        where: { id },
        data: {
          name,
          description,
          hatchPattern,
          fillColor
        }
      })

      // 2. Delete existing layers
      await tx.wallLayer.deleteMany({
        where: { templateId: id }
      })

      // 3. Create new layers
      if (layers && layers.length > 0) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await tx.wallLayer.createMany({
          data: layers.map((layer: any, index: number) => ({
             templateId: id,
             type: layer.type,
             thickness: layer.thickness,
             isStructural: layer.isStructural,
             sortOrder: index,
             materialId: layer.materialId || null
          }))
        })
      }

      // 4. Return updated with layers
      return await tx.wallTemplate.findUnique({
        where: { id },
        include: {
          layers: {
             include: { material: true },
             orderBy: { sortOrder: 'asc' }
          }
        }
      })
    })

    return NextResponse.json(updatedTemplate)
  } catch (error) {
    console.error('Error updating wall template:', error)
    return NextResponse.json({ error: 'Failed to update template' }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    
    // Check if system template
    const template = await prisma.wallTemplate.findUnique({ where: { id } })
    if (template?.isSystem) {
       return NextResponse.json({ error: 'Cannot delete system templates' }, { status: 403 })
    }

    await prisma.wallTemplate.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting wall template:', error)
    return NextResponse.json({ error: 'Failed to delete template' }, { status: 500 })
  }
}
