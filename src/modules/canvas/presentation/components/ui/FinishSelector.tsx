
import React, { useEffect } from 'react'
import { Room } from '@/modules/canvas/application/types'
import { useCanvasStore } from '@/modules/canvas/application/store'
import { FinishProduct } from '@prisma/client'

interface FinishSelectorProps {
  room: Room
}

export const FinishSelector: React.FC<FinishSelectorProps> = ({ room }) => {
  const { finishSchedules, updateRoomFinish, finishProducts, setFinishProducts } = useCanvasStore()
  
  // Load products if empty (Mock fetch for now, realistically this comes from API)
  useEffect(() => {
     if (finishProducts.length === 0) {
         // This would be an API call: fetch('/api/finishes').then(...)
         // For now, we rely on server-side seeding, but the frontend needs data access.
         // We'll create a simple server action or API route later.
         // Temporary Mock Data to unblock UI dev
         setFinishProducts([
             { id: '1', name: 'Ceramic Floor Tile - Beige', category: 'FLOOR', type: 'TILE' },
             { id: '2', name: 'Porcelain Nano Polished - Ivory', category: 'FLOOR', type: 'TILE' },
             { id: '3', name: 'Super Acrylic - White', category: 'WALL', type: 'PAINT' },
             { id: '4', name: 'Pine Skirting', category: 'TRIM', type: 'SKIRTING' },
         ])
     }
  }, [finishProducts.length, setFinishProducts])

  const schedule = finishSchedules.find(s => s.roomId === room.id) || {
      id: 'temp', roomId: room.id, projectId: 'temp', floor: {}, walls: {}, ceiling: {}
  }

  const handleFinishChange = (category: 'floor' | 'walls' | 'ceiling', field: string, value: string) => {
      const currentCategory = schedule[category] || {};
      updateRoomFinish(room.id, {
          [category]: { ...currentCategory, [field]: value }
      })
  }
  
  const floorOptions = finishProducts.filter(p => p.category === 'FLOOR')
  const wallOptions = finishProducts.filter(p => p.category === 'WALL')
  const trimOptions = finishProducts.filter(p => p.category === 'TRIM')

  return (
    <div className="space-y-4 p-2">
      
      {/* Floor Section */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-gray-500 uppercase">Floor Finish</label>
        <select 
            className="w-full p-2 text-sm border rounded bg-slate-50"
            value={schedule.floor?.finishId || ''}
            onChange={(e) => handleFinishChange('floor', 'finishId', e.target.value)}
        >
            <option value="">None / Screen</option>
            {floorOptions.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
            ))}
        </select>

        <label className="text-xs font-semibold text-gray-400">Skirting</label>
        <select 
            className="w-full p-2 text-sm border rounded bg-slate-50"
             value={schedule.floor?.skirtingId || ''}
            onChange={(e) => handleFinishChange('floor', 'skirtingId', e.target.value)}
        >
            <option value="">None</option>
            {trimOptions.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
            ))}
        </select>
      </div>

      <div className="h-px bg-gray-200" />

      {/* Wall Section */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-gray-500 uppercase">Wall Finish (Base)</label>
        <select 
            className="w-full p-2 text-sm border rounded bg-slate-50"
            value={schedule.walls?.finishId || ''}
            onChange={(e) => handleFinishChange('walls', 'finishId', e.target.value)}
        >
            <option value="">Plaster Only</option>
            {wallOptions.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
            ))}
        </select>
      </div>
      
      <div className="h-px bg-gray-200" />
      
      {/* Ceiling Section */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-gray-500 uppercase">Ceiling</label>
         <select 
            className="w-full p-2 text-sm border rounded bg-slate-50"
            value={schedule.ceiling?.finishId || ''}
            onChange={(e) => handleFinishChange('ceiling', 'finishId', e.target.value)}
        >
            <option value="">White Paint</option>
            {wallOptions.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
            ))}
        </select>
      </div>

    </div>
  )
}
