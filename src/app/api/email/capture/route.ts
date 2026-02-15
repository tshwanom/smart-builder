import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import nodemailer from 'nodemailer'

// Email transporter (configure with your SMTP)
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

export async function POST(request: NextRequest) {
  try {
    const { email, projectId } = await request.json()

    if (!email || !projectId) {
      return NextResponse.json(
        { error: 'Email and projectId required' },
        { status: 400 }
      )
    }

    // Find or create user
    let user = await prisma.user.findUnique({
      where: { email }
    })

    if (!user) {
      user = await prisma.user.create({
        data: { email }
      })
    }

    // Update project with user
    await prisma.project.update({
      where: { id: projectId },
      data: { userId: user.id }
    })

    // Send email
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1e40af;">Your BuildSmart AI Project is Waiting!</h2>
        <p>Hi there,</p>
        <p>You started creating a BOQ but didn't unlock it yet. Your project is saved and ready whenever you are!</p>
        
        <div style="background: #f1f5f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">What you'll get for R450:</h3>
          <ul>
            <li>✅ Complete Bill of Quantities</li>
            <li>✅ Exact material quantities</li>
            <li>✅ Shopping list by phase</li>
            <li>✅ Cost estimates</li>
            <li>✅ AI receipt scanning</li>
          </ul>
        </div>

        <a href="${process.env.NEXTAUTH_URL}/app?project=${projectId}" 
           style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">
          Complete Your BOQ →
        </a>

        <p style="margin-top: 30px; color: #64748b; font-size: 14px;">
          Questions? Reply to this email or visit our help center.
        </p>

        <p style="color: #64748b; font-size: 14px;">
          - The BuildSmart AI Team
        </p>
      </div>
    `

    await transporter.sendMail({
      from: process.env.SMTP_FROM || 'BuildSmart AI <noreply@buildsmart.ai>',
      to: email,
      subject: '🏗️ Your R450 BOQ is waiting!',
      html: emailHtml,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Email capture error:', error)
    return NextResponse.json(
      { error: 'Failed to capture email' },
      { status: 500 }
    )
  }
}


