
'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { X, Globe, Building, MapPin, User, Loader2 } from 'lucide-react'

interface Country {
  id: string
  name: string
  code: string
  currencySymbol: string
}

interface CreateProjectModalProps {
  isOpen: boolean
  onClose: () => void
}

export const CreateProjectModal: React.FC<CreateProjectModalProps> = ({ isOpen, onClose }) => {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [countries, setCountries] = useState<Country[]>([])
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    name: '',
    clientName: '',
    address: '',
    countryId: ''
  })

  // Fetch countries on mount
  useEffect(() => {
    if (isOpen && countries.length === 0) {
      fetch('/api/countries')
        .then(res => res.json())
        .then(data => {
          if (data.countries) {
            setCountries(data.countries)
            // Default to South Africa if available, or first one
            const za = data.countries.find((c: Country) => c.code === 'ZA')
            if (za) setFormData(prev => ({ ...prev, countryId: za.id }))
            else if (data.countries.length > 0) setFormData(prev => ({ ...prev, countryId: data.countries[0].id }))
          }
        })
        .catch(err => console.error('Failed to load countries:', err))
    }
  }, [isOpen, countries.length])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      if (!formData.name.trim()) throw new Error('Project name is required')
      if (!formData.countryId) throw new Error('Please select a country')

      const response = await fetch('/api/project', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            ...formData,
            geometry: { walls: [], rooms: [] } // Initialize empty state
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create project')
      }

      // Success! Redirect directly to the project editor
      window.location.href = `/project/${data.projectId}`
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      setIsLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-blue-600 px-6 py-4 flex items-center justify-between shrink-0">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Building className="text-blue-200" size={24} />
            New Project
          </h2>
          <button 
            onClick={onClose}
            className="text-blue-100 hover:text-white p-1 hover:bg-white/10 rounded transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Form */}
        <div className="p-6 overflow-y-auto">
            {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Project Name */}
                <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Project Name *</label>
                    <input
                        type="text"
                        value={formData.name}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                        placeholder="e.g. Smith Residence"
                        className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                        required
                        autoFocus
                    />
                </div>

                {/* Country Selection */}
                <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Country / Standards *</label>
                    <div className="relative">
                        <Globe className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <select
                            value={formData.countryId}
                            onChange={e => setFormData({ ...formData, countryId: e.target.value })}
                            className="w-full pl-10 pr-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all appearance-none bg-white"
                            required
                        >
                            {countries.length === 0 && <option value="">Loading countries...</option>}
                            {countries.map(country => (
                                <option key={country.id} value={country.id}>
                                    {country.name} ({country.currencySymbol})
                                </option>
                            ))}
                        </select>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">Determines building codes and currency.</p>
                </div>

                {/* Client Name */}
                <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Client Name <span className="text-slate-400 font-normal">(Optional)</span></label>
                    <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            value={formData.clientName}
                            onChange={e => setFormData({ ...formData, clientName: e.target.value })}
                            placeholder="e.g. John Doe"
                            className="w-full pl-10 pr-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                        />
                    </div>
                </div>

                {/* Address */}
                <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Site Address <span className="text-slate-400 font-normal">(Optional)</span></label>
                    <div className="relative">
                        <MapPin className="absolute left-3 top-3 text-slate-400" size={18} />
                        <textarea
                            value={formData.address}
                            onChange={e => setFormData({ ...formData, address: e.target.value })}
                            placeholder="e.g. 123 Main St"
                            className="w-full pl-10 pr-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-none h-24"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    {/* Province */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">Province</label>
                        <select
                            value={(formData as any).province || ''}
                            onChange={e => setFormData({ ...formData, province: e.target.value } as any)}
                            className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all bg-white"
                        >
                            <option value="">Select...</option>
                            <option value="Eastern Cape">Eastern Cape</option>
                            <option value="Free State">Free State</option>
                            <option value="Gauteng">Gauteng</option>
                            <option value="KwaZulu-Natal">KwaZulu-Natal</option>
                            <option value="Limpopo">Limpopo</option>
                            <option value="Mpumalanga">Mpumalanga</option>
                            <option value="Northern Cape">Northern Cape</option>
                            <option value="North West">North West</option>
                            <option value="Western Cape">Western Cape</option>
                        </select>
                    </div>

                    {/* City */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">City</label>
                        <input
                            type="text"
                            value={(formData as any).city || ''}
                            onChange={e => setFormData({ ...formData, city: e.target.value } as any)}
                            placeholder="e.g. Sandton"
                            className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                        />
                    </div>
                </div>

                {/* Submit Button */}
                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 transform active:scale-95"
                >
                    {isLoading ? (
                        <>
                            <Loader2 className="animate-spin" size={20} />
                            Creating Project...
                        </>
                    ) : (
                        'Start Project'
                    )}
                </button>
            </form>
        </div>
      </div>
    </div>
  )
}
