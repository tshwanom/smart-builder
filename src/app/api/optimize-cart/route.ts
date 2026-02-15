import { NextRequest, NextResponse } from 'next/server';
import { PriceOptimizerService, CartItem } from '@/modules/pricing/application/PriceOptimizer';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { items, region } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Invalid items list' }, { status: 400 });
    }

    if (!region) {
      return NextResponse.json({ error: 'Region is required' }, { status: 400 });
    }

    const optimizer = new PriceOptimizerService();
    const result = await optimizer.findBestPrices(items as CartItem[], region);

    return NextResponse.json(result);

  } catch (error) {
    console.error('Price Optimization Error:', error);
    return NextResponse.json({ error: 'Failed to optimize cart' }, { status: 500 });
  }
}
