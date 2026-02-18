import { RoofCalculator } from '../RoofCalculator';
import { RoofStructure } from '../../../../domain/types';

describe('RoofCalculator', () => {
  const standardGable: RoofStructure = {
    type: 'gable',
    pitch: 26,
    overhang: 600,
    trussType: 'howe',
    covering: {
      materialId: 'tile_concrete_double_roman',
      underlay: true
    },
    ceiling: {
      type: 'gypsum',
      insulation: true
    }
  };

  test('calculates correct surface area for gable roof', () => {
    // 100m² plan area, 26 degree pitch
    // Factor = 1 / cos(26) = 1.1126
    // Expected Area = 111.26 m²
    const area = RoofCalculator.calculateSurfaceArea(100, 26);
    expect(area).toBeCloseTo(111.26, 1);
  });

  test('estimates correct number of trusses', () => {
    // 10m x 10m building = 100m²
    // Trusses span 10m, spaced at 760mm (0.76m)
    // Count = ceil(10 / 0.76) + 1 = 14 + 1 = 15
    const quantities = RoofCalculator.calculateQuantities(100, 26, 0, standardGable);
    // Note: The calculator uses sqrt(area) for width if not provided, so 10m width is correct assumption
    expect(quantities.trusses.count).toBe(15);
  });

  test('calculates tile count correctly', () => {
    // 111.26 m² area
    // Standard concrete tiles ~ 10.5 tiles/m²
    // Expected = 111.26 * 10.5 = 1168 tiles
    const quantities = RoofCalculator.calculateQuantities(100, 26, 0, standardGable);
    expect(quantities.covering.count).toBeGreaterThan(1100);
    expect(quantities.covering.count).toBeLessThan(1200);
  });

  test('calculates batten length correctly', () => {
    // 111.26 m² area
    // Batten spacing ~ 320mm (0.32m)
    // Linear meters = Area / 0.32 = 347m
    const quantities = RoofCalculator.calculateQuantities(100, 26, 0, standardGable);
    expect(quantities.battens.length).toBeGreaterThan(340);
  });

  test('handles sheeting calculations', () => {
    const sheetingRoof: RoofStructure = {
      ...standardGable,
      covering: { materialId: 'sheeting_ibr_0.5', underlay: true }
    };
    
    const quantities = RoofCalculator.calculateQuantities(100, 26, 0, sheetingRoof);
    
    // Sheeting should return area, not count
    expect(quantities.covering.count).toBe(0);
    expect(quantities.covering.area).toBeGreaterThan(111); // loops include overlaps
  });
});
