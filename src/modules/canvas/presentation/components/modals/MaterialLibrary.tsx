'use client'

import React from 'react'

import { Box, Building2, Home, Layers } from 'lucide-react'

interface Material {
  id: string
  category: string
  name: string
  specifications: Record<string, unknown>
  unitsPerM2?: number
  mortarRatio?: string
  description?: string
}

interface MaterialLibraryProps {
  countryCode: string
  selectedMaterial: Material | null
  onMaterialSelect: (material: Material) => void
}

export const MaterialLibrary: React.FC<MaterialLibraryProps> = ({
  countryCode,
  selectedMaterial,
  onMaterialSelect,
}) => {
  // TODO: Fetch from API based on countryCode
  const materials: Material[] = [
    {
      id: 'za-brick-clay',
      category: 'brick',
      name: 'Clay Stock Brick',
      specifications: { dimensions: { length: 220, width: 106, height: 73 } },
      unitsPerM2: 55,
      mortarRatio: '1:4',
      description: 'Standard clay stock brick for load-bearing walls',
    },
    {
      id: 'za-brick-cement',
      category: 'brick',
      name: 'Cement Stock Brick',
      specifications: { dimensions: { length: 220, width: 106, height: 73 } },
      unitsPerM2: 55,
      mortarRatio: '1:4',
      description: 'Cement stock brick for load-bearing walls',
    },
    {
      id: 'za-block-140',
      category: 'block',
      name: 'Concrete Block (140mm)',
      specifications: { dimensions: { length: 390, width: 190, height: 140 } },
      unitsPerM2: 12.5,
      mortarRatio: '1:6',
      description: 'Standard 140mm concrete block',
    },
  ]

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'brick':
        return <Box size={20} />
      case 'block':
        return <Building2 size={20} />
      case 'roofing':
        return <Home size={20} />
      case 'slab':
        return <Layers size={20} />
      default:
        return <Box size={20} />
    }
  }

  const groupedMaterials = materials.reduce((acc, material) => {
    if (!acc[material.category]) {
      acc[material.category] = []
    }
    acc[material.category].push(material)
    return acc
  }, {} as Record<string, Material[]>)

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Material Library - {countryCode}
      </h3>

      <div className="space-y-4">
        {Object.entries(groupedMaterials).map(([category, items]) => (
          <div key={category}>
            <div className="flex items-center gap-2 mb-2">
              <div className="text-blue-600">
                {getCategoryIcon(category)}
              </div>
              <h4 className="font-medium text-gray-700 capitalize">
                {category}s
              </h4>
            </div>

            <div className="space-y-2 ml-7">
              {items.map((material) => (
                <button
                  key={material.id}
                  onClick={() => onMaterialSelect(material)}
                  className={`w-full text-left p-3 rounded-lg border transition-colors ${
                    selectedMaterial?.id === material.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="font-medium text-gray-900">
                    {material.name}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    {material.description}
                  </div>
                  <div className="flex gap-4 mt-2 text-xs text-gray-500">
                    {material.unitsPerM2 && (
                      <span>{material.unitsPerM2}/m²</span>
                    )}
                    {material.mortarRatio && (
                      <span>Mortar: {material.mortarRatio}</span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
