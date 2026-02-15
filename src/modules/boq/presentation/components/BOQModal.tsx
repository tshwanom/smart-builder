'use client'

import React from 'react'
import { X, Download } from 'lucide-react'
import { BOQDisplay } from './BOQDisplay'
import dynamic from 'next/dynamic'

const PaymentButton = dynamic(
  () => import('@/modules/payment/presentation/components/PaymentButton').then((mod) => mod.PaymentButton),
  { ssr: false }
)

interface BOQItem {
  category: string
  item: string
  quantity: number
  unit: string
  unitPrice?: number
  totalPrice?: number
  notes?: string
}

interface BOQModalProps {
  isOpen: boolean
  onClose: () => void
  boq: BOQItem[]
  isUnlocked: boolean
  projectName?: string
  floorArea: number // Floor area in m²
  onUnlock?: () => void // Trigger payment to unlock quantities
  onExportPDF?: () => void // Trigger payment for PDF export
  projectId?: string
}

// Pricing configuration
const PRICE_PER_SQM = 5 // R5 per m²

export const BOQModal: React.FC<BOQModalProps> = ({ 
  isOpen, 
  onClose, 
  boq, 
  isUnlocked,
  projectName = 'My Project',
  floorArea,
  onUnlock,
  onExportPDF,
  projectId
}) => {
  if (!isOpen) return null

  const unlockPrice = Math.ceil(floorArea * PRICE_PER_SQM)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-slate-50 shadow-2xl w-full h-full flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="bg-blue-600 px-4 py-2 text-white shrink-0 shadow-md z-10 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-bold">Bill of Quantities</h2>
            <span className="text-blue-200 text-sm hidden md:inline">| {projectName}</span>
          </div>
          <div className="flex items-center gap-2">
            {!isUnlocked && (
              <div className="hidden md:block">
                <PaymentButton
                  amount={unlockPrice}
                  email="user@example.com"
                  projectId={projectId || 'demo-project'}
                  onSuccess={() => onUnlock?.()}
                  onClose={() => {}}
                  text={`Unlock (R${unlockPrice})`}
                  className="bg-green-500 hover:bg-green-600 text-white px-3 py-1.5 rounded text-sm font-bold transition-all shadow hover:shadow-lg"
                />
              </div>
            )}
            <button
              onClick={() => onExportPDF?.()}
              className="px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded text-sm transition-colors flex items-center gap-2"
            >
              <Download size={16} />
              <span className="hidden sm:inline">Export</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-white/20 rounded transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto bg-white p-0">
            <BOQDisplay 
                items={boq}
                isUnlocked={isUnlocked}
                projectId={undefined}
                onUnlock={onUnlock}
                unlockPrice={unlockPrice}
            />
        </div>

        {/* Footer (Fixed for Mobile/Quick Access) */}
        {!isUnlocked && (
          <div className="shrink-0 bg-white border-t border-slate-200 px-4 py-2 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] z-20 flex items-center justify-between gap-4">
            <div className="hidden md:block text-slate-600 text-sm">
              <span className="font-semibold text-slate-800">Unlock full details:</span> Get precise quantities & shopping list.
            </div>
            <div className="flex-1 md:flex-none">
               <PaymentButton
                  amount={unlockPrice}
                  email="user@example.com"
                  projectId={projectId || 'demo-project'}
                  onSuccess={() => onUnlock?.()}
                  onClose={() => {}}
                  text={`Unlock Full Access (R${unlockPrice})`}
                  className="w-full md:w-auto bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-bold text-sm transition-all shadow hover:shadow-lg flex items-center justify-center gap-2"
                />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
