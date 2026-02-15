
import { NextRequest, NextResponse } from 'next/server'
import { supplierService } from '@/modules/supplier/application/SupplierService'

export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const { province, city, items } = body

        if (!province || !city) {
            return NextResponse.json({ error: 'Missing province or city' }, { status: 400 })
        }

        // Default items if none provided
        const productsToScrape = items || [
            'Cement 42.5N',
            'Clay Stock Brick',
            'Concrete Stone 19mm',
            'River Sand'
        ]

        // Trigger background processing (awaiting for prototype, but could be fire-and-forget)
        console.log(`[Cron] Starting price update for ${city}, ${province}`)
        
        // Note: In a real serverless env, we might need to use Vercel Functions or similar to keep this running
        // For this local prototype, we await it to see results.
        const results = await supplierService.detectPrices(productsToScrape, { province, city })

        return NextResponse.json({ 
            success: true, 
            message: `Updated ${results.length} prices`,
            data: results 
        })

    } catch (error) {
        console.error('Price update cron error:', error)
        return NextResponse.json({ error: 'Failed to update prices' }, { status: 500 })
    }
}
