import { BOQItem } from '@/core/engine/boqCalculator'

export type ConstructionPhase = 'foundation' | 'walling' | 'roofing'

export interface ShoppingListItem extends BOQItem {
  phase: ConstructionPhase
  priority: number // 1 = buy first, 3 = buy last
}

export interface PhaseGroup {
  phase: ConstructionPhase
  title: string
  description: string
  items: ShoppingListItem[]
  totalCost: number
}

export function generateShoppingList(boqItems: BOQItem[]): PhaseGroup[] {
  // Categorize items by construction phase
  const categorizedItems: ShoppingListItem[] = boqItems.map(item => {
    let phase: ConstructionPhase = 'walling'
    let priority = 2

    // Foundation items
    if (item.category === 'Foundation') {
      phase = 'foundation'
      priority = 1
    }
    // Roofing items
    else if (item.category === 'Roof Slab') {
      phase = 'roofing'
      priority = 3
    }
    // Walling items (default)
    else {
      phase = 'walling'
      priority = 2
    }

    return { ...item, phase, priority }
  })

  // Group by phase
  const phases: PhaseGroup[] = [
    {
      phase: 'foundation',
      title: 'Phase 1: Foundation',
      description: 'Buy these materials first. Start with excavation and foundation work.',
      items: categorizedItems.filter(i => i.phase === 'foundation'),
      totalCost: 0
    },
    {
      phase: 'walling',
      title: 'Phase 2: Walling',
      description: 'Buy after foundation is complete. For building walls.',
      items: categorizedItems.filter(i => i.phase === 'walling'),
      totalCost: 0
    },
    {
      phase: 'roofing',
      title: 'Phase 3: Roofing',
      description: 'Buy after walls are complete. For roof slab construction.',
      items: categorizedItems.filter(i => i.phase === 'roofing'),
      totalCost: 0
    }
  ]

  // Calculate total costs (if we had pricing)
  phases.forEach(phase => {
    phase.totalCost = phase.items.reduce((sum, item) => {
      // For MVP: No pricing yet, just count items
      return sum + (item.quantity || 0)
    }, 0)
  })

  return phases.filter(p => p.items.length > 0)
}


