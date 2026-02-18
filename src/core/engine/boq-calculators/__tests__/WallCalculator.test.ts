import { WallCalculator } from '../WallCalculator';
import { WallStructure } from '../../../../domain/types';

describe('WallCalculator', () => {
  const doubleSkin: WallStructure = WallCalculator.createDefaultDoubleSkin();
  const singleSkin: WallStructure = WallCalculator.createDefaultSingleSkin();
  
  test('calculates correct brick count for double skin wall', () => {
    // 10m x 2.7m = 27m²
    // Double skin = 2 skins
    // Skin 1: Stretcher (52 bricks/m²)
    // Skin 2: Stretcher (52 bricks/m²)
    // Total = 104 bricks/m²
    // Expected = 27 * 104 = 2808
    const quantities = WallCalculator.calculateQuantities(27, doubleSkin);
    expect(quantities.bricks).toBeGreaterThan(2800);
    expect(quantities.bricks).toBeLessThan(2820);
  });

  test('calculates correct brick count for single skin wall', () => {
    // 10m x 2.7m = 27m²
    // Single skin = 52 bricks/m²
    // Expected = 27 * 52 = 1404
    const quantities = WallCalculator.calculateQuantities(27, singleSkin);
    expect(quantities.bricks).toBeGreaterThan(1400);
    expect(quantities.bricks).toBeLessThan(1410);
  });

  test('calculates mortar volume', () => {
    // 27m² double skin = 2808 bricks
    // Mortar factor ~ 0.5 m³ per 1000 bricks
    // Expected = 2.808 * 0.5 = 1.404 m³
    const quantities = WallCalculator.calculateQuantities(27, doubleSkin);
    expect(quantities.mortarVolume).toBeCloseTo(1.4, 1);
  });

  test('calculates plaster area', () => {
    // 27m² wall
    // Plaster: internal + external = 27 + 27 = 54m²
    const quantities = WallCalculator.calculateQuantities(27, doubleSkin);
    expect(quantities.plasterArea).toBe(54);
  });

  test('identifies orientation correctly', () => {
      const headerWall: WallStructure = {
          ...singleSkin,
          skins: [{ materialId: 'brick_clay_stock', orientation: 'header' }]
      }
      // Header bond = 104 bricks/m² (220 wall)
      // 10m² = 1040 bricks
      const quantities = WallCalculator.calculateQuantities(10, headerWall);
      expect(quantities.bricks).toBeGreaterThan(1000);
  });
});
