
import { BOQItem } from './types';
import { RoomFinishDomain } from '@/modules/finishes/domain/FinishTypes';
import { FinishProduct } from '@prisma/client';

export const FinishesCalculator = {
  calculate(room: any, schedule: RoomFinishDomain, products: FinishProduct[]): BOQItem[] {
    const items: BOQItem[] = [];
    const area = room.area;
    const perimeter = room.perimeter; // Assuming these exist on Room domain

    // 1. Floor Finishes
    if (schedule.floor?.finishId) {
      const product = products.find(p => p.id === schedule.floor.finishId);
      if (product) {
        // Tile Logic
        if (product.type === 'TILE') {
           const waste = product.waste || 10;
           const grossArea = area * (1 + waste / 100);
           
           // Tiles
           items.push({
             id: `floor-tile-${room.id}`,
             category: 'Floor Finishes',
             item: product.name,
             description: `Supply and fit ${product.name} to ${room.name}`,
             quantity: parseFloat(grossArea.toFixed(2)),
             unit: 'm²',
             rate: product.price,
             totalPrice: grossArea * product.price
           });
           
           // Adhesive (approx 4kg/m2)
           const adhesiveQty = area * 4;
           items.push({
             id: `floor-adhesive-${room.id}`,
             category: 'Floor Finishes',
             item: 'Porcelain Adhesive (20kg)',
             description: `Adhesive for ${room.name} floor`,
             quantity: Math.ceil(adhesiveQty / 20),
             unit: 'bags',
             rate: 150, // R150/bag placeholder
             totalPrice: Math.ceil(adhesiveQty / 20) * 150
           });
        }
        // Paint/Laminate logic...
      }
    }
    
    // 2. Skirting
    const skirtingId = schedule.floor?.skirtingId || JSON.parse(schedule.floor?.spec || '{}').skirtingId;
    if (skirtingId) {
        items.push({
            id: `skirting-${room.id}`,
            category: 'Floor Finishes',
            item: 'Skirting',
            description: `Supply and fit skirting to ${room.name}`,
            quantity: parseFloat(perimeter.toFixed(2)), // Gross simplification (minus doors)
            unit: 'm',
            rate: 45,
            totalPrice: perimeter * 45
        });
    }

    // 3. Wall Paint
    if (schedule.walls?.finishId) {
       const product = products.find(p => p.id === schedule.walls.finishId);
       if (product && product.type === 'PAINT') {
           const height = 2.7; // default
           const wallArea = perimeter * height; // Simplified (minus openings)
           const coats = 2;
           const spread = product.spreadRate || 8;
           const liters = (wallArea * coats) / spread;
           
           items.push({
             id: `wall-paint-${room.id}`,
             category: 'Wall Finishes',
             item: product.name,
             description: `Paint to walls in ${room.name}`,
             quantity: parseFloat(liters.toFixed(1)),
             unit: 'L',
             rate: product.price,
             totalPrice: liters * product.price
           });
       }
    }

    return items;
  }
};
