import { NextRequest, NextResponse } from 'next/server'
import { calculateBOQ, BOQCalculationInput } from '@/core/engine/boqCalculator'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      wallArea, 
      wallLength, 
      floorArea, 
      wallHeight, 
      wallThickness, 
      foundationDepth, 
      projectId,
      roofType,
      roofPitch,
      openings, // Add openings
      finishes
    } = body

    // Validate input
    if (!wallArea || !wallLength || !floorArea) {
      return NextResponse.json(
        { error: 'Missing required fields: wallArea, wallLength, floorArea' },
        { status: 400 }
      )
    }

    const input: BOQCalculationInput = {
      wallArea: parseFloat(wallArea),
      wallLength: parseFloat(wallLength),
      floorArea: parseFloat(floorArea),
      wallHeight: wallHeight ? parseFloat(wallHeight) : undefined,
      wallThickness: wallThickness ? parseFloat(wallThickness) : undefined,
      foundationDepth: foundationDepth ? parseFloat(foundationDepth) : undefined,
      roofType: roofType || 'gable',
      roofPitch: roofPitch ? parseFloat(roofPitch) : undefined,
      openings: openings || [],
      finishes: finishes,
      mepConfig: body.mepConfig,
      electricalPoints: body.electricalPoints,
      plumbingPoints: body.plumbingPoints,
      rooms: body.rooms // Pass rooms for context
    }

    // Calculate BOQ
    const boq = calculateBOQ(input)

    // Check availability from database
    let isUnlocked = false
    if (projectId) {
      try {
        const project = await prisma.project.findUnique({
          where: { id: projectId }
        })
        isUnlocked = project?.isUnlocked ?? false
        console.log(`Project ${projectId} unlock status: ${isUnlocked}`)
      } catch (e) {
        console.error('Error fetching project status:', e)
      }
    } else {
        // If no project ID (e.g. demo mode before save), default to false or true depending on strategy.
        // For this flow (email -> create project -> boq), we should have a projectId.
        // If not, we lock it.
        isUnlocked = false
    }

    // Return BOQ with unlock status
    // Note: For extra security, we could scrub quantities here if !isUnlocked
    return NextResponse.json({
      success: true,
      boq,
      isUnlocked
    })
  } catch (error) {
    console.error('BOQ calculation error:', error)
    return NextResponse.json(
      { error: 'Failed to calculate BOQ', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}



