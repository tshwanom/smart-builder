'use client'

import React, { useState } from 'react'
import { Globe } from 'lucide-react'

interface Country {
  id: string
  code: string
  name: string
  currency: string
  currencySymbol: string
  buildingCode: string
  active: boolean
}

interface CountrySelectorProps {
  selectedCountry: Country | null
  onCountryChange: (country: Country) => void
}

export const CountrySelector: React.FC<CountrySelectorProps> = ({
  selectedCountry,
  onCountryChange,
}) => {
  const [isOpen, setIsOpen] = useState(false)

  // TODO: Fetch from API
  const countries: Country[] = [
    {
      id: 'za-001',
      code: 'ZA',
      name: 'South Africa',
      currency: 'ZAR',
      currencySymbol: 'R',
      buildingCode: 'SANS 10400',
      active: true,
    },
    // Future countries will be loaded from database
  ]

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
      >
        <Globe size={20} className="text-blue-600" />
        <div className="text-left">
          <div className="text-sm font-medium text-gray-900">
            {selectedCountry?.name || 'Select Country'}
          </div>
          {selectedCountry && (
            <div className="text-xs text-gray-500">
              {selectedCountry.buildingCode}
            </div>
          )}
        </div>
      </button>

      {isOpen && (
        <div className="absolute top-full mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          <div className="p-2">
            <div className="text-xs font-semibold text-gray-500 uppercase px-3 py-2">
              Available Countries
            </div>
            {countries.map((country) => (
              <button
                key={country.id}
                onClick={() => {
                  onCountryChange(country)
                  setIsOpen(false)
                }}
                className={`w-full text-left px-3 py-2 rounded-md hover:bg-blue-50 transition-colors ${
                  selectedCountry?.id === country.id ? 'bg-blue-100' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900">
                      {country.name}
                    </div>
                    <div className="text-sm text-gray-600">
                      {country.buildingCode}
                    </div>
                  </div>
                  <div className="text-sm text-gray-500">
                    {country.currencySymbol} {country.currency}
                  </div>
                </div>
              </button>
            ))}
          </div>

          <div className="border-t border-gray-200 p-3 bg-gray-50 rounded-b-lg">
            <p className="text-xs text-gray-600">
              More countries coming soon! Kenya, Nigeria, Ghana, UK, Australia...
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
