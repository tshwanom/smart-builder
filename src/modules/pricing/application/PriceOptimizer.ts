import { prisma } from '@/lib/prisma'; // Ensure correct import path

export interface CartItem {
  name: string;
  quantity: number;
}

export interface SupplierOffer {
  supplierName: string;
  branchName?: string;
  items: {
    itemName: string;
    price: number;
    subtotal: number;
    found: boolean;
  }[];
  totalCost: number;
  deliveryEstimate?: number; // Optional delivery cost
}

export interface OptimizationResult {
  bestSingleSource: SupplierOffer | null;
  cheapestCombination: SupplierOffer[]; // Split order
}

export class PriceOptimizerService {

  /**
   * Find the best prices for a list of items within a region.
   * Currently uses simple string matching. In future, use embeddings/fuzzy search.
   */
  async findBestPrices(items: CartItem[], region: string): Promise<OptimizationResult> {
    
    // 1. Fetch relevant prices from DB based on region
    // For now, we'll fetch all prices in the region to minimize DB calls -> optimization for scaling later
    const regionPrices = await prisma.productPrice.findMany({
      where: {
        OR: [
          { supplier: { branches: { some: { province: { contains: region, mode: 'insensitive' } } } } }, // Supplier has branch in region
          { branch: { province: { contains: region, mode: 'insensitive' } } } // Price is specific to branch in region
        ]
      },
      include: {
        supplier: true,
        branch: true
      }
    });

    // 2. Group prices by Supplier/Branch
    const supplieroffers: Map<string, SupplierOffer> = new Map();

    for (const price of regionPrices) {
      const key = price.branchId || price.supplierId;
      
      if (!supplieroffers.has(key)) {
        supplieroffers.set(key, {
          supplierName: price.supplier.name,
          branchName: price.branch?.name,
          items: [],
          totalCost: 0
        });
      }
      
      const offer = supplieroffers.get(key)!;
      
      // Check if this price matches any cart item
      // Simple case-insensitive containment match for MVP
      for (const cartItem of items) {
        if (price.productName.toLowerCase().includes(cartItem.name.toLowerCase()) || 
            cartItem.name.toLowerCase().includes(price.productName.toLowerCase())) {
          
            // Check if we already have a price for this item in this offer (take lowest)
            const existingItemIndex = offer.items.findIndex(i => i.itemName === cartItem.name);
            
            if (existingItemIndex === -1) {
                 offer.items.push({
                    itemName: cartItem.name,
                    price: price.price,
                    subtotal: price.price * cartItem.quantity,
                    found: true
                });
                offer.totalCost += price.price * cartItem.quantity;
            } else {
                // Update if cheaper (unlikely in same branch, but possible if duplicates)
                if (price.price < offer.items[existingItemIndex].price) {
                     offer.totalCost -= offer.items[existingItemIndex].subtotal;
                     offer.items[existingItemIndex].price = price.price;
                     offer.items[existingItemIndex].subtotal = price.price * cartItem.quantity;
                     offer.totalCost += price.price * cartItem.quantity;
                }
            }
        }
      }
    }

    // 3. Find Best Single Source (Supplier with most items found and lowest price)
    let bestSingle: SupplierOffer | null = null;
    let maxFound = 0;

    for (const offer of supplieroffers.values()) {
        const foundCount = offer.items.length;
        if (foundCount > maxFound) {
            maxFound = foundCount;
            bestSingle = offer;
        } else if (foundCount === maxFound) {
            if (!bestSingle || offer.totalCost < bestSingle.totalCost) {
                bestSingle = offer;
            }
        }
    }

    // 4. Find Cheapest Combination (Not implemented fully for MVP, just returning single source)
    // To do this properly, we'd need to solve a variation of the set cover problem or just greedy pick.
    
    return {
      bestSingleSource: bestSingle,
      cheapestCombination: bestSingle ? [bestSingle] : [] 
    };
  }
}
