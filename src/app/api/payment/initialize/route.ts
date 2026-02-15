import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { projectId, email, amount } = body

    // Validate input
    if (!projectId || !email || !amount) {
      return NextResponse.json(
        { error: 'Missing required fields: projectId, email, amount' },
        { status: 400 }
      )
    }

    // Check if project exists
    const project = await prisma.project.findUnique({
      where: { id: projectId }
    })

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      )
    }

    // Check if already unlocked
    if (project.isUnlocked) {
      return NextResponse.json(
        { error: 'Project already unlocked' },
        { status: 400 }
      )
    }

    // Create transaction record
    const transaction = await prisma.transaction.create({
      data: {
        projectId,
        userId: project.userId,
        amount: amount * 100, // Convert to cents
        currency: 'ZAR',
        status: 'pending'
      }
    })

    // Initialize Paystack payment
    const paystackResponse = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email,
        amount: amount * 100, // Paystack expects amount in kobo (cents)
        currency: 'ZAR',
        reference: transaction.id,
        metadata: {
          projectId,
          transactionId: transaction.id
        }
      })
    })

    const paystackData = await paystackResponse.json()

    if (!paystackData.status) {
      return NextResponse.json(
        { error: 'Failed to initialize payment' },
        { status: 500 }
      )
    }

    // Update transaction with Paystack reference
    await prisma.transaction.update({
      where: { id: transaction.id },
      data: { paystackRef: paystackData.data.reference }
    })

    return NextResponse.json({
      success: true,
      authorizationUrl: paystackData.data.authorization_url,
      reference: paystackData.data.reference
    })
  } catch (error) {
    console.error('Payment initialization error:', error)
    return NextResponse.json(
      { error: 'Failed to initialize payment' },
      { status: 500 }
    )
  }
}


