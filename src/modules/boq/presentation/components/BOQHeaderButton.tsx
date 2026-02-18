
'use client'

import React, { useState, useCallback } from 'react'
import { useCanvasStore } from '@/modules/canvas/application/store'
import { BOQItem } from '@/core/engine/boqCalculator'
import { BOQModal } from '@/modules/boq/presentation/components/BOQModal'
import { Calculator } from 'lucide-react'
import { useSession } from 'next-auth/react'
import dynamic from 'next/dynamic'
import { PaystackPaymentRef } from './PaystackPayment'

const PaystackPayment = dynamic(() => import('./PaystackPayment').then(mod => mod.PaystackPayment), { ssr: false })

export interface BOQHeaderButtonProps {
  projectId: string | null
}

export const BOQHeaderButton = React.forwardRef<HTMLButtonElement, BOQHeaderButtonProps>(({ projectId }, ref) => {
  const { data: session } = useSession()
  const { rooms, openings, mepConfig, electricalPoints, plumbingPoints } = useCanvasStore()
  const [boq, setBOQ] = useState<BOQItem[] | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isUnlocked, setIsUnlocked] = useState(false)
  const [showBOQModal, setShowBOQModal] = useState(false)
  const paystackRef = React.useRef<PaystackPaymentRef>(null)

  // Pricing
  const PRICE_PER_SQM = 5
  const floorArea = rooms.reduce((sum, r) => sum + (r.area || 0), 0)
  const unlockPrice = Math.ceil(floorArea * PRICE_PER_SQM)

  // Paystack config
  const publicKey = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || 'pk_test_54071674de32e670ff5a0310f8f6a46272e441d9'
  const paystackConfig = {
    reference: new Date().getTime().toString(),
    email: session?.user?.email || 'guest@mebala.co.za',
    amount: Math.round(unlockPrice * 100), // cents
    publicKey,
    metadata: { projectId: projectId || '', custom_fields: [] as never[] }
  }

  const handlePaymentSuccess = useCallback(async (reference: { reference: string }) => {
    console.log('Payment success', reference)
    try {
      const response = await fetch('/api/payment/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reference: reference.reference, projectId })
      })
      const data = await response.json()
      if (data.success) {
        setIsUnlocked(true)
      } else {
        alert('Payment verification failed')
      }
    } catch (error) {
      console.error('Payment verification error:', error)
      alert('Error verifying payment')
    }
  }, [projectId])

  const handlePaymentClose = useCallback(() => {
    console.log('Payment cancelled')
  }, [])

  const handleUnlockPayment = useCallback(() => {
    if (!projectId) {
      alert('Please generate a BOQ first')
      return
    }
    paystackRef.current?.startPayment()
  }, [projectId])

  const handleExportPDF = useCallback(() => {
    if (!isUnlocked) {
      handleUnlockPayment()
      return
    }
    window.print()
  }, [isUnlocked, handleUnlockPayment])

  const generateBOQ = async () => {
    if (rooms.length === 0) {
        alert('Please draw at least one room first.')
        return
    }
    if (!projectId) {
         alert('No project ID found. Please save the project first.')
         return 
    }

    setIsLoading(true)

    try {
      // Aggregate ALL rooms for BOQ calculation
      const wallHeight = 2.7
      const totalPerimeter = rooms.reduce((sum, r) => sum + (r.perimeter || 0), 0)
      const totalFloorArea = rooms.reduce((sum, r) => sum + (r.area || 0), 0)
      const totalWallArea = totalPerimeter * wallHeight
      
      const boqResponse = await fetch('/api/calculate-boq', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wallArea: totalWallArea,
          wallLength: totalPerimeter,
          floorArea: totalFloorArea,
          wallHeight,
          projectId: projectId,
          openings: openings,
          finishes: {
            floor: rooms[0]?.floorFinish || 'tiles',
            walls: rooms[0]?.wallFinish || 'paint',
            ceiling: rooms[0]?.ceilingFinish || 'paint'
          },
          // MEP Data
          mepConfig: mepConfig,
          electricalPoints: electricalPoints,
          plumbingPoints: plumbingPoints,
          rooms: rooms // Pass full room objects
        })
      })

      const boqData = await boqResponse.json()

      if (boqData.success) {
        setBOQ(boqData.boq)
        setIsUnlocked(boqData.isUnlocked || false)
        setShowBOQModal(true)
      } else {
        alert('Failed to generate BOQ')
      }
    } catch (error) {
      console.error('BOQ generation error:', error)
      alert('Error generating BOQ')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <button
        ref={ref}
        onClick={generateBOQ}
        disabled={isLoading || rooms.length === 0}
        className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
      >
        {isLoading ? (
          <div className="w-3 h-3 border-2 border-slate-600 border-t-transparent rounded-full animate-spin" />
        ) : (
          <Calculator size={14} />
        )}
        BOQ
      </button>

      <PaystackPayment 
        ref={paystackRef}
        config={paystackConfig}
        onSuccess={handlePaymentSuccess}
        onClose={handlePaymentClose}
      />

      <BOQModal
        isOpen={showBOQModal}
        onClose={() => setShowBOQModal(false)}
        boq={boq || []}
        isUnlocked={isUnlocked}
        projectName="Construction Project"
        floorArea={floorArea}
        onUnlock={handleUnlockPayment}
        onExportPDF={handleExportPDF}
        projectId={projectId || undefined}
      />
    </>
  )
})

BOQHeaderButton.displayName = 'BOQHeaderButton'
