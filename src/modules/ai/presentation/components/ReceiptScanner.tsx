'use client'

import React, { useState } from 'react'
import { Upload, CheckCircle, XCircle } from 'lucide-react'

interface ReceiptItem {
  name: string
  quantity: number
  unit: string
  unitPrice: number
  totalPrice: number
}

interface ReceiptData {
  store: string
  date: string
  items: ReceiptItem[]
  subtotal: number
  vat: number
  total: number
}

interface ReceiptScannerProps {
  projectId?: string
  onScanComplete?: (receipt: ReceiptData) => void
}

export const ReceiptScanner: React.FC<ReceiptScannerProps> = ({
  projectId,
  onScanComplete
}) => {
  const [isScanning, setIsScanning] = useState(false)
  const [receipt, setReceipt] = useState<ReceiptData | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsScanning(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('receipt', file)
      if (projectId) {
        formData.append('projectId', projectId)
      }

      const response = await fetch('/api/ai/scan-receipt', {
        method: 'POST',
        body: formData
      })

      const data = await response.json()

      if (data.success) {
        setReceipt(data.receipt)
        onScanComplete?.(data.receipt)
      } else {
        setError(data.error || 'Failed to scan receipt')
      }
    } catch (err) {
      console.error('Receipt scan error:', err)
      setError('Failed to scan receipt')
    } finally {
      setIsScanning(false)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4">Scan Receipt</h3>

      {/* Upload Area */}
      <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center mb-4">
        <Upload className="mx-auto mb-2 text-slate-400" size={48} />
        <p className="text-sm text-slate-600 mb-4">
          Upload a photo of your receipt to track expenses
        </p>
        <label className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg cursor-pointer transition-colors">
          {isScanning ? 'Scanning...' : 'Choose File'}
          <input
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            disabled={isScanning}
            className="hidden"
          />
        </label>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
          <XCircle className="text-red-600" size={20} />
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Success */}
      {receipt && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle className="text-green-600" size={20} />
            <h4 className="font-semibold text-green-900">Receipt Scanned!</h4>
          </div>

          <div className="space-y-2 text-sm">
            <p><strong>Store:</strong> {receipt.store}</p>
            <p><strong>Date:</strong> {receipt.date}</p>
            <p><strong>Items:</strong> {receipt.items.length}</p>
            <p className="text-lg font-bold text-green-700">
              Total: R {receipt.total.toFixed(2)}
            </p>
          </div>

          <details className="mt-3">
            <summary className="cursor-pointer text-sm text-green-700 hover:text-green-800">
              View Items
            </summary>
            <div className="mt-2 space-y-1">
              {receipt.items.map((item, index) => (
                <div key={index} className="text-xs bg-white rounded p-2">
                  <p className="font-medium">{item.name}</p>
                  <p className="text-slate-600">
                    {item.quantity} {item.unit} × R{item.unitPrice.toFixed(2)} = R{item.totalPrice.toFixed(2)}
                  </p>
                </div>
              ))}
            </div>
          </details>
        </div>
      )}
    </div>
  )
}


