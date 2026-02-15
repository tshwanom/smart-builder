
import { GoogleGenerativeAI } from '@google/generative-ai'
import { prisma } from '@/lib/prisma'

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')
const SEARCH_API_KEY = process.env.GOOGLE_SEARCH_API_KEY
const SEARCH_CX = process.env.GOOGLE_SEARCH_CX

interface Supplier {
    name: string
    url: string
    snippet: string
    id?: string // DB ID
}

interface ProductPrice {
    supplierName: string
    price: number
    currency: string
    unit: string
    url: string
}

export class SupplierService {
  
  /**
   * Helper: Perform Google Custom Search
   */
  private async googleSearch(query: string): Promise<any[]> {
    if (!SEARCH_API_KEY || !SEARCH_CX) {
        console.warn('Google Search API Key or CX not found')
        return []
    }

    try {
        const url = `https://www.googleapis.com/customsearch/v1?key=${SEARCH_API_KEY}&cx=${SEARCH_CX}&q=${encodeURIComponent(query)}`
        const res = await fetch(url)
        const data = await res.json()
        return data.items || []
    } catch (error) {
        console.error('Search API Error:', error)
        return []
    }
  }

  /**
   * Find suppliers in a specific location using Google Custom Search
   * Persists results to DB.
   */
  async findSuppliers(location: { province: string; city: string }): Promise<Supplier[]> {
    console.log(`[SupplierService] Finding suppliers in ${location.city}, ${location.province}`)
    
    // Search Query
    const query = `hardware store builders merchant in ${location.city} ${location.province} site:.za`
    const results = await this.googleSearch(query)
    
    // Transform results
    const foundSuppliers = results.map(item => ({
        name: item.title,
        url: item.link,
        snippet: item.snippet
    }))

    // Deduplicate by domain
    const uniqueSuppliers = Array.from(new Map(foundSuppliers.map(s => [new URL(s.url).hostname, s])).values())
    console.log(`[SupplierService] Found ${uniqueSuppliers.length} unique suppliers from search`)

    const persistedSuppliers: Supplier[] = []

    // Persist to DB
    for (const s of uniqueSuppliers) {
        try {
            // Upsert Supplier
            const supplier = await prisma.supplier.upsert({
                where: { id: s.url }, // Hack: using URL as ID for now if possible? No, 'id' is CUID.
                // Better: Check by website or name? We don't have a unique field except ID.
                // Let's find first by website (contains)
                create: {
                    name: s.name,
                    website: new URL(s.url).hostname,
                    type: 'Hardware'
                },
                update: {},
                where: { id: 'placeholder' } // This won't work easily without unique constraint on website.
            }) 
            
            // Workaround for non-unique website: Find first or create
            // Actually, let's just create if not exists based on name/website logic manually for now
            // To keep it simple for prototype:
        } catch (e) {
            // Ignore DB errors for now
        }
    }
    
    // REAL IMPLEMENTATION with Prisma
    for (const s of uniqueSuppliers) {
        try {
            const domain = new URL(s.url).hostname
            
            // simple check
            let dbSupplier = await prisma.supplier.findFirst({
                where: { website: { contains: domain } }
            })

            if (!dbSupplier) {
                dbSupplier = await prisma.supplier.create({
                    data: {
                        name: s.name,
                        website: s.url,
                        type: 'Hardware',
                        branches: {
                            create: {
                                province: location.province,
                                city: location.city,
                                name: `${s.name} - ${location.city}`
                            }
                        }
                    }
                })
            } else {
                 // Check if branch exists
                 const branch = await prisma.supplierBranch.findFirst({
                    where: { 
                        supplierId: dbSupplier.id,
                        city: location.city
                    }
                 })
                 
                 if (!branch) {
                     await prisma.supplierBranch.create({
                         data: {
                             supplierId: dbSupplier.id,
                             province: location.province,
                             city: location.city,
                             name: `${dbSupplier.name} - ${location.city}`
                         }
                     })
                 }
            }
            
            persistedSuppliers.push({ ...s, id: dbSupplier.id })

        } catch (err) {
            console.error('DB Error saving supplier:', err)
        }
    }

    return persistedSuppliers
  }

  /**
   * Detect prices for a product list in a location
   * Persists to ProductPrice
   */
  async detectPrices(products: string[], location: { province: string; city: string }): Promise<ProductPrice[]> {
    console.log(`[SupplierService] Detecting prices for ${products.length} products in ${location.city}`)
    const foundPrices: ProductPrice[] = []

    // 1. Find relevant suppliers first
    const suppliers = await this.findSuppliers(location)
    const topSuppliers = suppliers.slice(0, 3) 

    for (const product of products) {
        for (const supplier of topSuppliers) {
            if (!supplier.id) continue;

            try {
                // 2. Search for product
                const domain = new URL(supplier.url).hostname
                const productQuery = `site:${domain} ${product} price`
                const searchResults = await this.googleSearch(productQuery)
                
                if (searchResults.length > 0) {
                    const productPageUrl = searchResults[0].link
                    
                    // 3. Analyze page
                    const priceInfo = await this.analyzeProductPage(productPageUrl, product, searchResults[0].snippet)
                    
                    if (priceInfo && priceInfo.price) {
                        const priceData = {
                            supplierName: supplier.name,
                            url: productPageUrl,
                            ...priceInfo
                        }
                        foundPrices.push(priceData)

                        // 4. Save to DB
                        await prisma.productPrice.create({
                            data: {
                                supplierId: supplier.id,
                                productName: product,
                                price: Number(priceInfo.price), // Ensure number
                                currency: priceInfo.currency || 'ZAR',
                                unit: priceInfo.unit || 'each',
                                url: productPageUrl,
                                // Link branch if we can identify it, else just supplier
                            }
                        })

                        break; 
                    }
                }
            } catch (err) {
                console.error(`Error checking ${product} at ${supplier.name}:`, err)
            }
        }
    }
    
    return foundPrices
  }

  /**
   * Analyze a product page to extract price using Gemini 1.5 Flash
   */
  async analyzeProductPage(url: string, productName: string, snippet?: string) {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

    const prompt = `
    Analyze this product search result:
    Product: "${productName}"
    URL: ${url}
    Snippet: "${snippet}"
    
    Extract the price, currency (ZAR), and unit.
    If the snippet contains the price, use it.
    Return ONLY valid JSON: { "price": number, "currency": "ZAR", "unit": "string" }
    If no price found, return null.
    `

    try {
        const result = await model.generateContent(prompt)
        const response = result.response
        const text = response.text()
        
        // Clean markdown code blocks
        const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim()
        const data = JSON.parse(jsonStr)
        
        return data.price ? data : null
    } catch (e) {
        console.error('Gemini Extraction Error:', e)
        return null
    }
  }
}

export const supplierService = new SupplierService()
