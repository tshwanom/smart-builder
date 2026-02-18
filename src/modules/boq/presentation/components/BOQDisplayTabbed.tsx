'use client'

import React, { useState } from 'react'
import { Package, Hammer, Home, Layers, Paintbrush } from 'lucide-react'

import { BOQItem } from '@/core/engine/boqCalculator'

interface BOQDisplayTabbedProps {
  boq: BOQItem[]
  isUnlocked: boolean
}

type PhaseTab = 'foundation' | 'walling' | 'roof' | 'finishes'

export const BOQDisplayTabbed: React.FC<BOQDisplayTabbedProps> = ({ boq, isUnlocked }) => {
  const [activeTab, setActiveTab] = useState<PhaseTab>('foundation')

  // Group BOQ items by phase
  const groupedBOQ = {
    foundation: boq.filter(item => item.category.toLowerCase().includes('foundation') || item.category.toLowerCase().includes('damp')),
    walling: boq.filter(item => item.category.toLowerCase().includes('wall') || item.category.toLowerCase().includes('lintel')),
    roof: boq.filter(item => item.category.toLowerCase().includes('roof')),
    finishes: boq.filter(item => item.category.toLowerCase().includes('finish'))
  }

  const tabs = [
    { id: 'foundation' as PhaseTab, label: 'Foundation', icon: Package, count: groupedBOQ.foundation.length },
    { id: 'walling' as PhaseTab, label: 'Walling', icon: Hammer, count: groupedBOQ.walling.length },
    { id: 'roof' as PhaseTab, label: 'Roof', icon: Home, count: groupedBOQ.roof.length },
    { id: 'finishes' as PhaseTab, label: 'Finishes', icon: Paintbrush, count: groupedBOQ.finishes.length }
  ]

  const renderItems = (items: BOQItem[]) => {
    if (items.length === 0) {
      return (
        <div className="text-center py-8 text-gray-500">
          <p className="text-sm">No items in this phase</p>
        </div>
      )
    }

    return (
      <div className="space-y-3">
        {items.map((item, index) => (
          <div key={index} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-2">
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900">{item.item}</h4>
                <p className="text-xs text-gray-500 mt-1">{item.category}</p>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-blue-600">
                  {isUnlocked ? (
                    <>{item.quantity.toFixed(2)} {item.unit}</>
                  ) : (
                    <span className="text-gray-400">🔒 Locked</span>
                  )}
                </div>
              </div>
            </div>
            
            {item.notes && (
              <div className="mt-2 text-xs text-gray-600 bg-gray-50 px-3 py-2 rounded">
                💡 {item.notes}
              </div>
            )}
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Tab Headers */}
      <div className="flex border-b border-gray-200 bg-white sticky top-0 z-10">
        {tabs.map(tab => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 px-4 py-3 font-medium transition-all ${
                isActive
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <div className="flex flex-col items-center gap-1">
                <Icon size={20} />
                <span className="text-xs">{tab.label}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  isActive ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
                }`}>
                  {tab.count}
                </span>
              </div>
            </button>
          )
        })}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
        {renderItems(groupedBOQ[activeTab])}
      </div>

      {/* Total Summary */}
      <div className="border-t border-gray-200 bg-white p-4">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-sm text-gray-600">Total Items</p>
            <p className="text-2xl font-bold text-gray-900">{boq.length}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">Status</p>
            <p className={`text-lg font-semibold ${isUnlocked ? 'text-green-600' : 'text-orange-600'}`}>
              {isUnlocked ? '✅ Unlocked' : '🔒 Locked'}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
