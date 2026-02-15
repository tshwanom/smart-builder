'use client'

import React from 'react'
import { usePaystackPayment } from 'react-paystack'

interface PaymentButtonProps {
  amount: number // in Rands
  email: string
  projectId: string
  onSuccess: () => void
  onClose: () => void
  text?: string
  className?: string
}

export const PaymentButton: React.FC<PaymentButtonProps> = ({ 
  amount, 
  email, 
  projectId,
  onSuccess, 
  onClose,
  text,
  className
}) => {
  // Use public test key if env var is missing for dev
  const publicKey = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || 'pk_test_54071674de32e670ff5a0310f8f6a46272e441d9' 

  const config = {
    reference: new Date().getTime().toString(),
    email: email.trim(),
    amount: Math.round(amount * 100), // Paystack expects amount in cents (kobo)
    publicKey,
    currency: 'ZAR',
    metadata: {
      projectId,
      custom_fields: []
    }
  }

  // DEBUGGING: Log the clean config
  console.log('Using Paystack Config:', { email: config.email, amount: config.amount, projectId: config.metadata.projectId, currency: config.currency })


  const initializePayment = usePaystackPayment(config)

  const handleSuccess = async (reference: { reference: string, message: string, status: string }) => {
    // Verify on server
    try {
      const response = await fetch('/api/payment/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reference: reference.reference,
          projectId
        })
      })
      
      const data = await response.json()
      if (data.success) {
        onSuccess()
      } else {
        alert('Payment verification failed')
      }
    } catch (error) {
      console.error('Payment verification error:', error)
      alert('Error verifying payment')
    }
  }

  return (
    <button
      onClick={() => initializePayment({ onSuccess: handleSuccess, onClose })}
      className={className || "bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg shadow-md transition-all transform hover:scale-105"}
    >
      {text || `Unlock Quantities for R${amount}`}
    </button>
  )
}
