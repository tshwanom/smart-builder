import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import crypto from 'crypto'

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get('x-paystack-signature')

    // Verify webhook signature
    const hash = crypto
      .createHmac('sha512', process.env.PAYSTACK_SECRET_KEY!)
      .update(body)
      .digest('hex')

    if (hash !== signature) {
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      )
    }

    const event = JSON.parse(body)

    // Handle successful payment
    if (event.event === 'charge.success') {
      const { reference, metadata } = event.data

      // Find transaction
      const transaction = await prisma.transaction.findFirst({
        where: {
          OR: [
            { id: metadata.transactionId },
            { paystackRef: reference }
          ]
        }
      })

      if (!transaction) {
        console.error('Transaction not found:', reference)
        return NextResponse.json({ error: 'Transaction not found' }, { status: 404 })
      }

      // Update transaction status
      await prisma.transaction.update({
        where: { id: transaction.id },
        data: { status: 'success' }
      })

      // Unlock project
      await prisma.project.update({
        where: { id: transaction.projectId },
        data: { isUnlocked: true }
      })

      console.log('Project unlocked:', transaction.projectId)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}


