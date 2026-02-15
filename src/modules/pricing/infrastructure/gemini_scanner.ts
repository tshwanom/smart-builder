import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || "");

export interface ExtractedItem {
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface ExtractionResult {
  merchant: {
    name: string;
    address?: string;
    date?: string;
  };
  items: ExtractedItem[];
  totalAmount?: number;
}

export class GeminiScanner {
  // Define fallback hierarchy: 3.0 Flash -> 2.0 Flash -> 1.5 Flash
  private models = ["gemini-3.0-flash", "gemini-2.0-flash", "gemini-1.5-flash"];

  constructor() {}

  async scanQuotation(imageBase64: string, mimeType: string = "image/jpeg"): Promise<ExtractionResult> {
    const prompt = `
      Analyze this quotation/invoice image. Extract the following data in JSON format:
      - merchant: { name, address, date }
      - items: array of { description, quantity, unitPrice, totalPrice }
      - totalAmount: grand total number
      
      Ensure numeric values are numbers, not strings.
      If a field is missing, use null or empty string.
    `;

    const imagePart = {
      inlineData: {
        data: imageBase64,
        mimeType
      },
    };

    let lastError: any;

    // Iterate through models in order of preference
    for (const modelName of this.models) {
      try {
        console.log(`Attempting scan with model: ${modelName}`);
        const model = genAI.getGenerativeModel({ model: modelName, generationConfig: { responseMimeType: "application/json" } });
        
        const result = await model.generateContent([prompt, imagePart]);
        const response = await result.response;
        const text = response.text();
        
        // Clean up markdown code blocks if present
        const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
        
        return JSON.parse(cleanJson) as ExtractionResult;
        
      } catch (error) {
        console.warn(`Model ${modelName} failed:`, error);
        lastError = error;
        // Continue to next model
      }
    }

    // If loop finishes without returning, all models failed
    console.error("All Gemini models failed. Last error:", lastError);
    throw new Error("Failed to extract data from quotation after trying all available models.");
  }
}
