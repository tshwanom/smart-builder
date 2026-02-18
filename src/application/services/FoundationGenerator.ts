import { WallSegment, FoundationConfig } from '../../domain/types'

/**
 * Implements SANS 10400-H (Foundations) logic
 * 
 * Standard Rules for Strip Footings (Single Storey):
 * - Minimum width: 600mm (for external walls)
 * - Minimum thickness: 230mm
 * - Concrete grade: 15MPa (min)
 * 
 * NOTE: For "Standard" mode we default to these values.
 * "Engineer" mode allows overrides.
 */

export const FoundationGenerator = {
  
  /**
   * Generates a standard SANS 10400 compliant strip footing configuration
   */
  generateStandardStripFooting: (wallThickness: number): FoundationConfig => {
    // SANS 10400-H: Strip footing width usually driven by wall thickness & soil
    // Default safe assumption for single storey masonry:
    // Width = max(600, wallThickness * 3)
    const minWidth = 600
    const calculatedWidth = Math.max(minWidth, wallThickness * 3)
    
    return {
      type: 'strip',
      width: calculatedWidth,
      depth: 230, // Standard minimum
      offset: 0,  // Centered
      concreteGrade: '25MPa', // Using 25MPa as a quality default (SANS min is 15)
      reinforcement: {
        mainBars: 'Y12',
        mainBarCount: 4, // 2 top, 2 bottom standard practice
        stirrups: 'R8',
        stirrupSpacing: 300 // mm
      }
    }
  },

  /**
   * Calculates concrete volume in cubic meters
   */
  calculateVolume: (length: number, config: FoundationConfig): number => {
    // Length (m) * Width (mm->m) * Depth (mm->m)
    return length * (config.width / 1000) * (config.depth / 1000)
  }
}
