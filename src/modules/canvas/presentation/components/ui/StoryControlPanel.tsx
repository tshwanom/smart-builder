'use client'

import React from 'react'
import { useCanvasStore } from '../../../application/store'
import { Plus, Trash2, Eye, EyeOff, Layers } from 'lucide-react'
import { cn } from '@/lib/utils'

export const StoryControlPanel: React.FC = () => {
  const { 
    stories, 
    activeStoryId, 
    addStory, 
    deleteStory, 
    setActiveStory,
    referenceSettings,
    setReferenceSettings
  } = useCanvasStore()

  // Sort stories by level (ascending)
  // We want to display them bottom-up (like a building), so reverse the sorted array
  const sortedStories = [...stories].sort((a, b) => a.level - b.level).reverse()

  return (
    <div className="absolute top-20 right-4 bg-white p-3 rounded-lg shadow-lg border border-slate-200 w-64 z-50">
      <div className="flex items-center justify-between mb-3 border-b pb-2">
        <h3 className="font-semibold text-sm flex items-center gap-2">
            <Layers className="w-4 h-4" /> Levels
        </h3>
        <button 
          onClick={() => addStory()}
          className="p-1 hover:bg-slate-100 rounded text-blue-600"
          title="Add New Level"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      <div className="flex flex-col gap-1 max-h-60 overflow-y-auto mb-3">
        {sortedStories.map(story => (
          <div 
            key={story.id} 
            className={cn(
              "flex items-center justify-between p-2 rounded cursor-pointer text-sm group",
              activeStoryId === story.id ? "bg-blue-50 border-blue-200 border" : "hover:bg-slate-50 border border-transparent"
            )}
            onClick={() => setActiveStory(story.id)}
          >
            <div className="flex flex-col">
                <span className="font-medium">{story.name}</span>
                <span className="text-xs text-slate-500">
                    {story.height}mm | +{(story.elevation / 1000).toFixed(2)}m
                </span>
            </div>
            {activeStoryId !== story.id && (
                 <button 
                    onClick={(e) => {
                        e.stopPropagation()
                        deleteStory(story.id)
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-500 transition-opacity"
                    title="Delete Level"
                 >
                    <Trash2 className="w-3 h-3" />
                 </button>
            )}
          </div>
        ))}
        {stories.length === 0 && (
            <div className="text-xs text-slate-400 text-center py-2">No levels defined</div>
        )}
      </div>

      {stories.length > 1 && (
          <div className="pt-2 border-t text-xs">
            <div className="font-medium mb-1 text-slate-600">Reference Overlay</div>
            <div className="flex items-center justify-between mb-1">
                <span>Show Below</span>
                <button 
                    onClick={() => setReferenceSettings({ showBelow: !referenceSettings.showBelow })}
                    className={cn("p-1 rounded", referenceSettings.showBelow ? "text-blue-600 bg-blue-50" : "text-slate-400")}
                >
                    {referenceSettings.showBelow ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                </button>
            </div>
            <div className="flex items-center justify-between">
                <span>Show Above</span>
                <button 
                    onClick={() => setReferenceSettings({ showAbove: !referenceSettings.showAbove })}
                    className={cn("p-1 rounded", referenceSettings.showAbove ? "text-blue-600 bg-blue-50" : "text-slate-400")}
                >
                    {referenceSettings.showAbove ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                </button>
            </div>
          </div>
      )}
    </div>
  )
}
