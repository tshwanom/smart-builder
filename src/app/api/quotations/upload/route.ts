import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma'; // Assuming prisma client is exported from here
import { GeminiScanner } from '@/modules/pricing/infrastructure/gemini_scanner';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Convert file to base64
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64Image = buffer.toString('base64');
    const mimeType = file.type;

    // Scan with Gemini
    const scanner = new GeminiScanner();
    const extractionResult = await scanner.scanQuotation(base64Image, mimeType);

    // Save to Database
    // 1. Create or Find Supplier/Merchant
    let supplierId = null;
    if (extractionResult.merchant.name) {
        let supplier = await prisma.supplier.findFirst({
            where: { name: extractionResult.merchant.name }
        });

        if (!supplier) {
            supplier = await prisma.supplier.create({
                data: {
                    name: extractionResult.merchant.name,
                    type: 'Hardware' // Default, can be refined
                }
            });
        }
        supplierId = supplier.id;
    }

    // 2. Save Scan Record
    const scanRecord = await prisma.scannedQuotation.create({
        data: {
            imageUrl: "TODO_UPLOAD_TO_BLOB_STORAGE", // skipping blob upload for MVP, or we interpret it as storing raw data just for processed verification
            rawData: JSON.stringify(extractionResult),
            status: 'PROCESSED',
            merchantName: extractionResult.merchant.name,
            scanDate: extractionResult.merchant.date ? new Date(extractionResult.merchant.date) : new Date(),
            totalAmount: extractionResult.totalAmount
        }
    });

    // 3. Save Product Prices
    if (supplierId && extractionResult.items.length > 0) {
        for (const item of extractionResult.items) {
             await prisma.productPrice.create({
                 data: {
                     supplierId: supplierId,
                     productName: item.description,
                     price: item.unitPrice,
                     unit: 'each', // Default, logic needed to parse "m2" etc from description
                     description: `Extracted quantity: ${item.quantity}`,
                 }
             });
        }
    }

    return NextResponse.json({ success: true, data: extractionResult, scanId: scanRecord.id });

  } catch (error) {
    console.error('Upload Error:', error);
    return NextResponse.json({ error: 'Failed to process quotation' }, { status: 500 });
  }
}
