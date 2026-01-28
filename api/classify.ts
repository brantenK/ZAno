import { GoogleGenAI, Type } from "@google/genai";

// Vercel Edge Function to proxy Gemini API calls
// This keeps the API key server-side only

export const config = {
    runtime: 'edge',
};

const DocTypes = ['INVOICE', 'BANK_STATEMENT', 'RECEIPT', 'TAX_LETTER', 'OTHER'] as const;

interface ClassifyRequest {
    subject: string;
    snippet: string;
    fileName?: string;
}

export default async function handler(request: Request) {
    // Only allow POST
    if (request.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method not allowed' }), {
            status: 405,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    // Check for API key
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        return new Response(JSON.stringify({ error: 'Server configuration error' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    try {
        const body: ClassifyRequest = await request.json();
        const { subject, snippet, fileName } = body;

        if (!subject && !snippet) {
            return new Response(JSON.stringify({ error: 'Missing required fields' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        const ai = new GoogleGenAI({ apiKey });

        const prompt = `
      Analyze the following email metadata and determine if it contains a financial document.
      Subject: "${subject}"
      Snippet: "${snippet}"
      Attachment Name: "${fileName || 'None'}"

      Classify it into one of: INVOICE, BANK_STATEMENT, RECEIPT, TAX_LETTER, or OTHER.
      Also extract the Vendor/Sender Name, estimated Amount, and Currency if possible.
    `;

        const response = await ai.models.generateContent({
            model: "gemini-2.0-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        type: {
                            type: Type.STRING,
                            enum: DocTypes,
                        },
                        vendorName: { type: Type.STRING },
                        amount: { type: Type.STRING },
                        currency: { type: Type.STRING },
                        reasoning: { type: Type.STRING },
                    },
                    required: ["type", "vendorName"],
                },
            },
        });

        const text = response.text || "{}";
        const result = JSON.parse(text);

        return new Response(JSON.stringify(result), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error: any) {
        console.error('Classification error:', error);
        return new Response(
            JSON.stringify({
                error: 'Classification failed',
                message: error.message
            }),
            {
                status: 500,
                headers: { 'Content-Type': 'application/json' },
            }
        );
    }
}
