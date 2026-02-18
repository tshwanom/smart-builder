'use client'

import React, { useState } from 'react'
import { BOQItem } from '@/core/engine/boqCalculator'
import { Lock, Download, Package } from 'lucide-react'
import dynamic from 'next/dynamic'

const PaymentButton = dynamic(
  () => import('@/modules/payment/presentation/components/PaymentButton').then((mod) => mod.PaymentButton),
  { ssr: false }
)
import { ShoppingList } from '@/modules/shopping/presentation/components/ShoppingList'

import { Story } from '@/modules/canvas/application/types'

interface BOQDisplayProps {
  items: BOQItem[]
  stories?: Story[]
  isUnlocked: boolean
  projectId?: string
  email?: string
  onUnlock?: () => void
  unlockPrice?: number
}

// Define Phases
const PHASES = [
  { id: 'foundations', label: 'Foundations', keywords: ['foundation', 'excavation', 'subfloor'] },
  { id: 'structure', label: 'Structure', keywords: ['wall', 'brick', 'lintel', 'concrete slab'] },
  { id: 'roof', label: 'Roofing', keywords: ['roof', 'truss', 'sheeting', 'ceiling'] },
  { id: 'openings', label: 'Openings', keywords: ['window', 'door', 'glazing', 'frame'] },
  { id: 'finishes', label: 'Finishes', keywords: ['finish', 'paint', 'tile', 'plaster'] },
  { id: 'electrical', label: 'Electrical', keywords: ['electrical', 'light', 'switch', 'socket', 'wire', 'conduit'] },
  { id: 'plumbing', label: 'Plumbing', keywords: ['plumbing', 'pipe', 'basin', 'shower', 'toilet'] },
  { id: 'other', label: 'Other', keywords: [] }
]

export const BOQDisplay: React.FC<BOQDisplayProps> = ({
  items,
  isUnlocked,
  projectId,
  email = 'user@example.com',
  onUnlock,
  unlockPrice = 450,
  stories = []
}) => {
  const [activeView, setActiveView] = useState<'boq' | 'shopping'>('boq')
  const [activePhase, setActivePhase] = useState<string>('foundations')

  const [activeStoryFilter, setActiveStoryFilter] = useState<string>('all')
  const [isGroupedByStory, setIsGroupedByStory] = useState<boolean>(false)
  
  // User overridden rates: Key = "Category-ItemName", Value = Rate
  const [userRates, setUserRates] = React.useState<Record<string, number>>({})

  // Generate unique key for an item
  const getItemKey = React.useCallback((item: BOQItem) => `${item.category}-${item.item}`, [])

  // Fetch saved rates
  React.useEffect(() => {
    if (isUnlocked && projectId) {
      fetch(`/api/project/${projectId}/boq-rates`)
        .then(res => res.json())
        .then(data => {
            if (data.rates) {
                const rateMap: Record<string, number> = {}
                data.rates.forEach((r: { itemKey: string; rate: number }) => {
                    rateMap[r.itemKey] = r.rate
                })
                setUserRates(rateMap)
            }
        })
        .catch(err => console.error('Failed to load rates:', err))
    }
  }, [isUnlocked, projectId])

  // Save rate to API
  const saveRate = async (item: BOQItem, newRate: number) => {
      if (!projectId) return
      
      const key = getItemKey(item)
      // Optimistic update
      setUserRates(prev => ({ ...prev, [key]: newRate }))

      try {
          await fetch(`/api/project/${projectId}/boq-rates`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ itemKey: key, rate: newRate })
          })
      } catch (err) {
          console.error('Failed to save rate:', err)
          // Revert? For now just log
      }
  }

  // Get effective price (user override or default)
  const getEffectivePrice = React.useCallback((item: BOQItem) => {
      const key = getItemKey(item)
      return userRates[key] !== undefined ? userRates[key] : (item.rate || 0)
  }, [userRates, getItemKey])

  // Get effective total (quantity * effective price)
  const getEffectiveTotal = React.useCallback((item: BOQItem) => {
      const price = getEffectivePrice(item)
      return (item.quantity || 0) * price
  }, [getEffectivePrice])

  // Group items by Phase -> Category
  const phasedItems = React.useMemo(() => {
    // 1. Filter by Story
    const filteredItems = activeStoryFilter === 'all' 
        ? items 
        : items.filter(i => i.storyId === activeStoryFilter || (!i.storyId && activeStoryFilter === 'ground'))

    const acc = filteredItems.reduce((acc, item) => {
      // Determine Phase
      const catLower = item.category.toLowerCase()
      let phaseId = 'other'
      
      for (const phase of PHASES) {
          if (phase.keywords.some(k => catLower.includes(k))) {
              phaseId = phase.id
              break
          }
      }
      
      if (!acc[phaseId]) acc[phaseId] = {}
      if (!acc[phaseId][item.category]) acc[phaseId][item.category] = []
      
      acc[phaseId][item.category].push(item)
      return acc
    }, {} as Record<string, Record<string, BOQItem[]>>)

    // Ensure all phases exist for tabs
    PHASES.forEach(p => {
        if (!acc[p.id]) acc[p.id] = {}
    })
    
    return acc
  }, [items, activeStoryFilter])

  // Get categories for current active phase
  const groupedItems = React.useMemo(() => phasedItems[activePhase] || {}, [phasedItems, activePhase])
  
  // Calculate totals (Dynamic based on user rates)
  // Total cost should probably reflect the VIEW (filtered) or the PROJECT (unfiltered)?
  // Usually "Total Project Value" implies everything.
  // But maybe user wants "Total for Story".
  
  // Let's make "Total Project Value" always be global
  const projectTotalCost = React.useMemo(() => {
      return items.reduce((sum, item) => sum + getEffectiveTotal(item), 0)
  }, [items, getEffectiveTotal])

  // Phase total matches current view (filtered)
  const currentViewTotal = React.useMemo(() => {
     // We need to re-calculate based on filtered items of this phase
     return Object.values(groupedItems).flat().reduce((sum, item) => sum + getEffectiveTotal(item), 0)
  }, [groupedItems, getEffectiveTotal])



  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full">
      {/* Top Bar: View Switcher + Totals */}
      <div className="flex border-b border-slate-200 bg-slate-50 shrink-0 h-10">
        <button
          onClick={() => setActiveView('boq')}
          className={`px-4 text-sm font-semibold transition-all relative flex items-center gap-2 h-full ${
            activeView === 'boq'
              ? 'text-blue-600 bg-white border-r border-slate-200'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border-r border-slate-200'
          }`}
        >
            <Package size={16} />
            BOQ Items
            {activeView === 'boq' && <div className="absolute top-0 left-0 right-0 h-0.5 bg-blue-600" />}
        </button>
        <button
          onClick={() => setActiveView('shopping')}
          className={`px-4 text-sm font-semibold transition-all relative flex items-center gap-2 h-full ${
            activeView === 'shopping'
              ? 'text-blue-600 bg-white border-r border-slate-200'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border-r border-slate-200'
          }`}
        >
            <Download size={16} />
            Shopping List
            {activeView === 'shopping' && <div className="absolute top-0 left-0 right-0 h-0.5 bg-blue-600" />}
        </button>
        
        <div className="flex-1 flex items-center justify-end px-4 gap-2">

            <div className="text-right flex items-center gap-4">
                {isUnlocked && (
                    <button
                        onClick={async () => {
                            if (!projectId) return;
                            const btn = document.getElementById('update-rates-btn');
                            if (btn) {
                                btn.textContent = 'Updating...';
                                (btn as HTMLButtonElement).disabled = true;
                            }
                            
                            try {
                                // 1. Get Project Location
                                const projRes = await fetch(`/api/project/${projectId}`);
                                const projData = await projRes.json();
                                
                                if (!projData.project?.province || !projData.project?.city) {
                                    alert('Project does not have a location set. Please edit project details.');
                                    return;
                                }

                                // 2. Trigger Background Update
                                const cronRes = await fetch('/api/cron/update-prices', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                        province: projData.project.province,
                                        city: projData.project.city,
                                        items: Object.values(items).map(i => i.item).slice(0, 10) // Top 10 items
                                    })
                                });
                                
                                const cronData = await cronRes.json();
                                if (cronData.success) {
                                    alert(`Started checking prices for ${projData.project.city}! Check back shortly.`);
                                    // Optionally reload rates
                                } else {
                                    alert('Failed to start update.');
                                }
                            } catch (error) {
                                console.error(error);
                                alert('Error updating rates.');
                            } finally {
                                if (btn) {
                                    btn.innerHTML = '<span class="flex items-center gap-2"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M3 21v-5h5"/></svg> Update Rates</span>';
                                    (btn as HTMLButtonElement).disabled = false;
                                }
                            }
                        }}
                        id="update-rates-btn"
                        className="px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors flex items-center gap-2"
                    >
                        <Lock size={14} className="hidden" /> {/* Hack to keep import unused if needed, better: import RefreshCw */}
                        Update Rates
                    </button>
                )}
                <div className="flex flex-col items-end">
                    {/* Story Selector or Group Toggle */}
                    <div className="flex bg-slate-100 rounded p-0.5 mb-1 gap-1">
                        <button
                            onClick={() => setIsGroupedByStory(false)}
                            className={`text-[10px] px-2 py-0.5 rounded ${!isGroupedByStory ? 'bg-white shadow text-blue-600 font-bold' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            Consolidated
                        </button>
                        <button
                            onClick={() => setIsGroupedByStory(true)}
                            className={`text-[10px] px-2 py-0.5 rounded ${isGroupedByStory ? 'bg-white shadow text-blue-600 font-bold' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            Group by Story
                        </button>
                    </div>

                    {!isGroupedByStory && stories.length > 0 && (
                        <select 
                            value={activeStoryFilter}
                            onChange={(e) => setActiveStoryFilter(e.target.value)}
                            className="mb-1 text-xs border border-slate-200 rounded px-1 py-0.5 bg-slate-50 text-slate-600 focus:outline-none focus:border-blue-400"
                        >
                            <option value="all">All Stories</option>
                            {stories.map(s => (
                                <option key={s.id} value={s.id}>{s.name}</option>
                            ))}
                        </select>
                    )}

                    <span className="text-xs text-slate-500 uppercase font-bold">Total Project Value</span>
                    <span className="text-base font-mono font-bold text-green-600">
                        R {projectTotalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                </div>
            </div>

        </div>
      </div>

      {activeView === 'boq' && (
          /* Horizontal Phase Tabs */
          <div className="flex bg-white border-b border-slate-200 overflow-x-auto shrink-0 scrollbar-hide h-10">
              {PHASES.map(phase => {
                  const itemCount = Object.values(phasedItems[phase.id] || {}).flat().length
                  if (itemCount === 0 && phase.id !== 'foundations') return null // Skip empty phases except first

                  const isActive = activePhase === phase.id
                  return (
                    <button
                        key={phase.id}
                        onClick={() => setActivePhase(phase.id)}
                        className={`px-4 text-xs font-medium whitespace-nowrap transition-colors border-b-2 h-full flex items-center ${
                            isActive 
                            ? 'border-blue-600 text-blue-800 bg-blue-50/50' 
                            : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                        }`}
                    >
                        {phase.label}
                        <span className={`ml-2 text-[10px] py-0.5 px-1.5 rounded-full ${isActive ? 'bg-blue-200 text-blue-800' : 'bg-slate-100 text-slate-600'}`}>
                            {itemCount}
                        </span>
                    </button>
                  )
              })}
          </div>
      )}

      {/* Content Area */}
      <div className="flex-1 overflow-auto bg-white min-h-0">
        {activeView === 'boq' ? (
          <div className="min-w-full inline-block align-middle">
            {Object.keys(groupedItems).length === 0 ? (
                <div className="p-12 text-center text-slate-400">
                    <p>No items in this phase.</p>
                </div>
            ) : (
            <table className="min-w-full border-collapse">
              <thead className="bg-slate-50 sticky top-0 z-10 shadow-sm">
                <tr>
                   <th className="px-3 py-2 text-left text-xs font-bold text-slate-700 uppercase tracking-wider border border-slate-300 bg-slate-100 w-1/2">Item Description</th>
                   <th className="px-3 py-2 text-center text-xs font-bold text-slate-700 uppercase tracking-wider border border-slate-300 bg-slate-100 w-24">Unit</th>
                   <th className="px-3 py-2 text-right text-xs font-bold text-slate-700 uppercase tracking-wider border border-slate-300 bg-slate-100 w-24">Quantity</th>
                   <th className="px-3 py-2 text-right text-xs font-bold text-slate-700 uppercase tracking-wider border border-slate-300 bg-slate-100 w-32">Rate (R)</th>
                   <th className="px-3 py-2 text-right text-xs font-bold text-slate-700 uppercase tracking-wider border border-slate-300 bg-slate-100 w-32">Amount</th>
                </tr>
              </thead>
              <tbody className="bg-white">

                {/* 
                    RENDER LOGIC:
                    If Consolidated -> Show Categories -> Items
                    If Grouped -> Show Story Headers -> Categories -> Items
                */}
                
                {!isGroupedByStory ? (
                    // CONSOLIDATED VIEW (Standard)
                    Object.entries(groupedItems).length === 0 ? (
                        <tr>
                            <td colSpan={6} className="px-4 py-8 text-center text-slate-400 italic">
                                No items in this phase
                            </td>
                        </tr>
                    ) : (
                        Object.entries(groupedItems).map(([category, items]) => (
                            <React.Fragment key={category}>
                                {/* Category Header */}
                                <tr className="bg-white border-b border-slate-100">
                                    <td className="px-3 py-2 font-bold text-slate-700 bg-slate-50/50" rowSpan={items.length + 1}>
                                        {category}
                                    </td>
                                </tr>
                                {items.map((item) => {
                                    const effectiveTotal = getEffectiveTotal(item)
                                    const effectivePrice = getEffectivePrice(item)
                                    const uniqueKey = getItemKey(item)
                                    
                                    return (
                                        <tr key={uniqueKey} className="group hover:bg-white border-b border-slate-100 transition-colors">
                                            {/* Category Col spanned above */}
                                            <td className="px-3 py-1.5 text-slate-700 font-medium">
                                                {item.name || item.item}
                                                {item.notes && <div className="text-[10px] text-slate-400 italic font-normal">{item.notes}</div>}
                                            </td>
                                            <td className="px-3 py-1.5 text-right font-mono text-slate-600">
                                                {item.quantity.toFixed(2)}
                                            </td>
                                            <td className="px-3 py-1.5 text-slate-400 text-xs">
                                                {item.unit}
                                            </td>
                                            <td className="px-3 py-1.5 text-right cursor-pointer group-hover:bg-slate-50">
                                                <div className="flex items-center justify-end gap-1">
                                                    <span className="text-slate-400 text-xs select-none">R</span>
                                                    <input 
                                                        type="number" 
                                                        className="w-20 text-right bg-transparent border-none focus:ring-0 p-0 font-mono text-slate-600 focus:text-blue-600 text-sm"
                                                        value={effectivePrice}
                                                        onChange={(e) => saveRate(item, parseFloat(e.target.value))}
                                                    />
                                                </div>
                                            </td>
                                            <td className="px-3 py-1.5 text-right font-mono font-bold text-slate-700 bg-slate-50/30">
                                                R {effectiveTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </td>
                                        </tr>
                                    )
                                })}
                            </React.Fragment>
                        ))
                    )
                ) : (
                     // GROUPED BY STORY VIEW
                     (() => {
                        // We need to regroup 'groupedItems' (Phase Items) by Story ID
                        // groupedItems is Record<Category, BOQItem[]>
                        // We want: Story -> Category -> Items
                        
                        const allPhaseItems = Object.values(groupedItems).flat()
                        if (allPhaseItems.length === 0) {
                            return (
                                <tr>
                                    <td colSpan={6} className="px-4 py-8 text-center text-slate-400 italic">
                                        No items in this phase
                                    </td>
                                </tr>
                            )
                        }

                        // definedStories + 'General' for things without storyId?
                        // Actually, every item should have storyId now if we set it up right.
                        // Or if undefined, fallback to 'Ground' or 'Allocated'.
                        
                        // Let's iterate through known stories to keep order
                        const activeStoryIds = new Set(allPhaseItems.map(i => i.storyId))
                        // Add 'undefined' if any items lack storyId
                        if (allPhaseItems.some(i => !i.storyId)) activeStoryIds.add('undefined')

                        // Display Order: defined stories by level, then general
                        const sortedDisplayStories = stories
                            .filter(s => activeStoryIds.has(s.id))
                            .sort((a,b) => a.level - b.level)
                        
                        // Items with no story or invalid story
                        const orphanItems = allPhaseItems.filter(i => !i.storyId || !stories.find(s => s.id === i.storyId))
                        
                        const renderStoryBlock = (storyName: string, storyItems: BOQItem[]) => {
                             if (storyItems.length === 0) return null
                             
                             // Group by category within this story
                             const catMap: Record<string, BOQItem[]> = {}
                             storyItems.forEach(i => {
                                 if (!catMap[i.category]) catMap[i.category] = []
                                 catMap[i.category].push(i)
                             })
                             
                             const storyTotal = storyItems.reduce((sum, i) => sum + getEffectiveTotal(i), 0)

                             return (
                                 <React.Fragment key={storyName}>
                                     {/* STORY HEADER ROW */}
                                     <tr className="bg-slate-200/80 border-b-2 border-slate-300">
                                         <td colSpan={5} className="px-3 py-2 text-sm font-bold text-slate-800 uppercase tracking-wide">
                                             {storyName}
                                         </td>
                                         <td className="px-3 py-2 text-right font-mono font-bold text-slate-800">
                                             R {storyTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                         </td>
                                     </tr>
                                     
                                     {/* CATEGORIES */}
                                     {Object.entries(catMap).map(([category, items]) => (
                                         <React.Fragment key={category}>
                                            <tr className="bg-white border-b border-slate-100">
                                                <td className="px-3 py-2 font-bold text-slate-600 bg-slate-50/20 pl-6 border-l-4 border-slate-300" rowSpan={items.length + 1}>
                                                    {category}
                                                </td>
                                            </tr>
                                            {items.map((item, idx) => {
                                                const effectiveTotal = getEffectiveTotal(item)
                                                const effectivePrice = getEffectivePrice(item)
                                                const uniqueKey = getItemKey(item) + idx // Add index as duplicate items might appear if grouped differently? No, items are unique objects.
                                                
                                                return (
                                                    <tr key={uniqueKey} className="group hover:bg-white border-b border-slate-100 transition-colors">
                                                        <td className="px-3 py-1.5 text-slate-700 font-medium">
                                                            {item.name || item.item}
                                                        </td>
                                                        <td className="px-3 py-1.5 text-right font-mono text-slate-600">
                                                            {item.quantity.toFixed(2)}
                                                        </td>
                                                        <td className="px-3 py-1.5 text-slate-400 text-xs text-left">
                                                            {item.unit}
                                                        </td>
                                                        <td className="px-3 py-1.5 text-right cursor-pointer group-hover:bg-slate-50">
                                                           {/* Rate Input reused */}
                                                            <div className="flex items-center justify-end gap-1">
                                                                <span className="text-slate-400 text-xs select-none">R</span>
                                                                <input 
                                                                    type="number" 
                                                                    className="w-20 text-right bg-transparent border-none focus:ring-0 p-0 font-mono text-slate-600 focus:text-blue-600 text-sm"
                                                                    value={effectivePrice}
                                                                    onChange={(e) => saveRate(item, parseFloat(e.target.value))}
                                                                />
                                                            </div>
                                                        </td>
                                                         <td className="px-3 py-1.5 text-right font-mono font-bold text-slate-700 bg-slate-50/30">
                                                            R {effectiveTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                        </td>
                                                    </tr>
                                                )
                                            })}
                                         </React.Fragment>
                                     ))}
                                 </React.Fragment>
                             )
                        }

                        return (
                            <>
                                {sortedDisplayStories.map(s => 
                                    renderStoryBlock(s.name, allPhaseItems.filter(i => i.storyId === s.id))
                                )}
                                {renderStoryBlock("General / Unassigned", orphanItems)}
                            </>
                        )
                     })()
                )}

                {/* Phase Total Row */}
                <tr className="bg-blue-50/50 border-t-2 border-blue-200">
                  <td colSpan={5} className="px-3 py-3 border border-slate-300 text-right font-bold text-blue-900 uppercase text-xs">
                    Total for {PHASES.find(p => p.id === activePhase)?.label} Phase {activeStoryFilter !== 'all' && !isGroupedByStory && '(Filtered)'}
                  </td>
                  <td className="px-3 py-3 border border-slate-300 text-right font-bold text-blue-700 text-base">
                    R {currentViewTotal.toFixed(2)}
                  </td>
                </tr>
              </tbody>
            </table>
            )}
          </div>
        ) : (
          /* Shopping List */
          <div className="p-6">
            {isUnlocked ? (
                <ShoppingList items={items} stories={stories} projectId={projectId} isGroupedByStory={isGroupedByStory} />
            ) : (
                <div className="py-12 text-center">
                <div className="w-16 h-16 bg-slate-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <Lock className="text-slate-400" size={24} />
                </div>
                <h3 className="text-lg font-bold text-slate-700 mb-2">
                    Shopping List Locked
                </h3>
                <p className="text-slate-500 mb-6 text-sm">
                    Unlock your BOQ to access the phased shopping list
                </p>
                {projectId && email && (
                    <PaymentButton
                    amount={unlockPrice}
                    email={email}
                    projectId={projectId}
                    onSuccess={() => onUnlock?.()}
                    onClose={() => console.log('Payment closed')}
                    />
                )}
                </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
