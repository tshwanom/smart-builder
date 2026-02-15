import React, { useMemo } from 'react'
import { useCanvasStore } from '@/modules/canvas/application/store'
import { calculateBOQ, BOQItem } from '@/core/engine/boqCalculator'
import { BOQDisplay } from './BOQDisplay'

export const BOQPanel: React.FC = () => {
  const { 
    walls, 
    rooms, 
    openings, 
    // roofPanels, // Unused
    electricalPoints, 
    plumbingPoints, 
    boqConfig, 
    mepConfig,
    // activeStoryId, // Unused
    stories,
    staircases
  } = useCanvasStore()

  // Calculate BOQ Items based on current store state
  const boqItems = useMemo(() => {
    // Helper to calculate BOQ for a specific subset of elements
    const calculateForStory = (
        storyName: string, 
        storyId: string | undefined,
        storyWalls: typeof walls, 
        storyRooms: typeof rooms, 
        storyOpenings: typeof openings,
        storyElec: typeof electricalPoints,
        storyPlumb: typeof plumbingPoints,
        storyStaircases: typeof staircases
    ) => {
        // Derived metrics for this story
        const wallLength = storyWalls.reduce((sum, w) => sum + (w.length || 0), 0)
        // Basic wall area approximation
        const defaultHeight = 2.7
        const wallArea = storyWalls.reduce((sum, w) => sum + ((w.length || 0) * (w.height || defaultHeight)), 0)
        const floorArea = storyRooms.reduce((sum, r) => sum + r.area, 0)

        const safeMepConfig = {
            electrical: {
                standard: 'sans_10142' as const,
                routingMode: mepConfig.electrical.routingMode === 'floor' ? 'floor' as const : 'ceiling' as const,
                ceilingHeight: 2700, // Default
                voltage: 230, // Default
                conduitType: 'pvc' as const,
                wireType: 'house_wire' as const
            },
            plumbing: {
                standard: 'sans_10252' as const,
                pipeType: mepConfig.plumbing.pipeType,
                supplyType: 'municipal' as const
            }
        }

        const items = calculateBOQ({
            wallArea,
            wallLength,
            floorArea,
            wallHeight: defaultHeight,
            roofType: boqConfig.roofType,
            roofPitch: boqConfig.roofPitch,
            openings: storyOpenings,
            mepConfig: safeMepConfig,
            electricalPoints: storyElec,
            plumbingPoints: storyPlumb,
            rooms: storyRooms, 
            finishes: boqConfig.finishes,
            staircases: storyStaircases
        })

        // Tag items with story info
        return items.map(item => ({
            ...item,
            storyName,
            storyId
        }))
    }

    // 1. Group Elements by Story
    // If no stories defined, treat everything as "Ground Floor"
    if (stories.length === 0) {
        return calculateForStory("Ground Floor", undefined, walls, rooms, openings, electricalPoints, plumbingPoints, staircases)
    }

    // Iterate through stories
    let allItems: BOQItem[] = []
    
    // Sort stories by level (optional, but good for order)
    const sortedStories = [...stories].sort((a,b) => a.level - b.level)

    sortedStories.forEach(story => {
        const sWalls = walls.filter(w => w.storyId === story.id || (!w.storyId && story.level === 0))
        const sRooms = rooms.filter(r => r.storyId === story.id || (!r.storyId && story.level === 0))
        const sOpenings = openings.filter(o => o.storyId === story.id || (!o.storyId && story.level === 0))
        
        // MEP currently doesn't strictly have storyId on points in interface, 
        // asking for "story awareness" on all elements. 
        // Assuming MEP points will be updated or we filter by proximity/fallback? 
        // For now, let's filter purely by storyId if present, else fallback to ground.
        const sElec = electricalPoints.filter(p => p.storyId === story.id || (!p.storyId && story.level === 0))
        const sPlumb = plumbingPoints.filter(p => p.storyId === story.id || (!p.storyId && story.level === 0))
        const sStaircases = staircases.filter(s => s.storyId === story.id || (!s.storyId && story.level === 0))

        const storyItems = calculateForStory(story.name, story.id, sWalls, sRooms, sOpenings, sElec, sPlumb, sStaircases)
        allItems = [...allItems, ...storyItems]
    })

    return allItems

  }, [walls, rooms, openings, electricalPoints, plumbingPoints, boqConfig, mepConfig, stories, staircases])

  // Get project ID if available (e.g. from URL or context)
  // For now, in generic app page, we might not have it.
  // Ideally, valid project ID is needed for saving rates.
  // If we are on [id] page, we should pass it down. 
  // But this component is used in generic context. 
  // Let's check window location or similar if strictly needed, or accept prop.
  // For valid build, we pass undefined if not available.
  
  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50">
       <BOQDisplay 
         items={boqItems} 
         stories={stories}
         isUnlocked={true} // Default to true for local playground/calculator? Or false?
         // If we want to support saving, we need a project ID.
         // If this is the main app page `src/app/app/page.tsx`, it implies a playground or "draft" mode.
       />
    </div>
  )
}
