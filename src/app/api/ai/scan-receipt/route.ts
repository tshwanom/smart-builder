import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { prisma } from '@/lib/prisma'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('receipt') as File
    const projectId = formData.get('projectId') as string

    if (!file) {
      return NextResponse.json(
        { error: 'No receipt file provided' },
        { status: 400 }
      )
    }

    // Convert file to base64
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const base64Image = buffer.toString('base64')

    // Initialize Gemini Vision
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

    const prompt = `
You are a receipt parser for construction materials. Analyze this receipt image and extract the following information in JSON format:

{
  "store": "store name",
  "date": "YYYY-MM-DD",
  "items": [
    {
      "name": "item name",
      "quantity": number,
      "unit": "unit type (e.g., bags, m³, units)",
      "unitPrice": number,
      "totalPrice": number
    }
  ],
  "subtotal": number,
  "vat": number,
  "total": number
}

Rules:
- Extract only construction-related items (cement, bricks, sand, steel, etc.)
- Convert all prices to numbers (remove currency symbols)
- Use standard units (bags, m³, kg, m, units)
- If quantity is not clear, use 1
- Return ONLY valid JSON, no additional text
`

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: base64Image,
          mimeType: file.type
        }
      }
    ])

    const response = await result.response
    const text = response.text()

    // Parse JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return NextResponse.json(
        { error: 'Failed to parse receipt' },
        { status: 500 }
      )
    }

    const receiptData = JSON.parse(jsonMatch[0])

    // Store receipt data if projectId provided
    if (projectId) {
      const project = await prisma.project.findUnique({
        where: { id: projectId }
      })

      if (project) {
        // Store in project metadata (for MVP)
        // In production: Create separate Purchase table
        await prisma.project.update({
          where: { id: projectId },
          data: {
            geometry: {
              ...(project.geometry as any),
              receipts: [
                ...((project.geometry as any)?.receipts || []),
                {
                  ...receiptData,
                  uploadedAt: new Date().toISOString()
                }
              ]
            }
          }
        })
      }
    }

    return NextResponse.json({
      success: true,
      receipt: receiptData
    })
  } catch (error) {
    console.error('Receipt scanning error:', error)
    return NextResponse.json(
      { error: 'Failed to scan receipt' },
      { status: 500 }
    )
  }
}


