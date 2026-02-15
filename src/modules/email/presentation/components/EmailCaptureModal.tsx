'use client'

import React, { useState } from 'react'
import { Mail, X } from 'lucide-react'

interface EmailCaptureModalProps {
  projectId: string
  onClose: () => void
  onSuccess: () => void
}

export const EmailCaptureModal: React.FC<EmailCaptureModalProps> = ({
  projectId,
  onClose,
  onSuccess
}) => {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch('/api/email/capture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, projectId })
      })

      if (response.ok) {
        onSuccess()
      } else {
        alert('Failed to save email')
      }
    } catch (error) {
      console.error('Email capture error:', error)
      alert('Failed to save email')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
        >
          <X size={24} />
        </button>

        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Mail className="text-blue-600" size={32} />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">
            Save Your Project
          </h2>
          <p className="text-slate-600">
            Enter your email to save this project and unlock it later
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white font-semibold py-3 rounded-lg transition-all"
          >
            {isLoading ? 'Saving...' : 'Save Project'}
          </button>
        </form>

        <p className="text-xs text-slate-500 text-center mt-4">
          We&apos;ll send you a reminder to complete your BOQ
        </p>
      </div>
    </div>
  )
}


