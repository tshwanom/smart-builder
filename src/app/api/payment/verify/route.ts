import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const { reference, projectId } = await request.json()

    if (!reference || !projectId) {
      return NextResponse.json(
        { error: 'Missing reference or projectId' },
        { status: 400 }
      )
    }

    // 1. Verify the transaction with Paystack API
    const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY
    if (!paystackSecretKey) {
      console.error('PAYSTACK_SECRET_KEY not configured')
      return NextResponse.json(
        { error: 'Payment service not configured' },
        { status: 500 }
      )
    }

    const verifyResponse = await fetch(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${paystackSecretKey}`,
          'Content-Type': 'application/json'
        }
      }
    )

    const verifyData = await verifyResponse.json()

    if (!verifyData.status || verifyData.data?.status !== 'success') {
      console.error('Paystack verification failed:', verifyData)
      return NextResponse.json(
        { error: 'Payment not verified by Paystack', details: verifyData.message },
        { status: 400 }
      )
    }

    // Extract verified amount from Paystack (in kobo/cents)
    const verifiedAmountInCents = verifyData.data.amount

    // 2. Unlock the project
    await prisma.project.update({
      where: { id: projectId },
      data: { isUnlocked: true }
    })

    // 3. Record the verified transaction
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { userId: true }
    })

    if (project) {
      await prisma.transaction.create({
        data: {
          projectId,
          userId: project.userId,
          amount: verifiedAmountInCents, // Use actual verified amount from Paystack
          status: 'success',
          paystackRef: reference
        }
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Payment verification error:', error)
    return NextResponse.json(
      { error: 'Verification failed' },
      { status: 500 }
    )
  }
}
