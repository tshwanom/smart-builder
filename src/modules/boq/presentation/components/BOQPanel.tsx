import React from 'react'
import { BOQDisplay } from './BOQDisplay'
import { useBoqData } from '../hooks/useBoqData'

export const BOQPanel: React.FC = () => {
  const { boqItems } = useBoqData()

  // Mocks for display props where we don't have full data yet
  const stories = [{ id: 'story-1', name: 'Ground Floor', level: 0, height: 2700, elevation: 0 }]

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50">
       <BOQDisplay 
         items={boqItems} 
         stories={stories}
         isUnlocked={true} 
       />
    </div>
  )
}
