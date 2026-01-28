import { GoogleGenAI } from "@google/genai";

// Vercel Edge Function to proxy HelpBot chat calls
// This keeps the API key server-side only

export const config = {
    runtime: 'edge',
};

// App context for the AI to understand
const APP_CONTEXT = `
You are Zano AI Assistant, a helpful chatbot embedded in the Zano Finance Autopilot app.

## About Zano Finance Autopilot
Zano is a financial document automation tool that:
- Scans Gmail for invoices, receipts, bank statements, and tax documents
- Uses AI (Gemini) to classify documents automatically
- Uploads and organizes documents in Google Drive folders
- Tracks suppliers and their documents

## Key Features
1. **Dashboard** - Overview of processed documents, daily reports, and sync status
2. **Supplier Manager** - Add/edit suppliers, set email domains, fetch their documents
3. **Discover Senders** - Find potential suppliers from your inbox automatically
4. **Autopilot Sync** - One-click scan and organize all financial documents

## Common User Questions
- "How do I add a supplier?" → Go to Supplier Manager, click "Add Supplier", fill in name and email domain
- "How do I sync my emails?" → Click "Run Autopilot Sync" on the Dashboard
- "Where are my documents saved?" → In your Google Drive under "Zano" folder, organized by type and vendor
- "How do I find senders?" → Go to Supplier Manager, click "Discover Senders"
- "Is my data secure?" → Yes, your documents stay in YOUR Google Drive. We only read metadata.

## Tone
- Be friendly, concise, and helpful
- Use emojis sparingly for warmth
- If you don't know something, say so
- Guide users step-by-step when needed
`;

interface ChatMessage {
    role: 'user' | 'model';
    parts: { text: string }[];
}

interface ChatRequest {
    message: string;
    history?: ChatMessage[];
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
        const body: ChatRequest = await request.json();
        const { message, history = [] } = body;

        if (!message) {
            return new Response(JSON.stringify({ error: 'Missing message' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        const ai = new GoogleGenAI({ apiKey });

        // Build full conversation with context
        const contents = [
            { role: 'user' as const, parts: [{ text: APP_CONTEXT }] },
            { role: 'model' as const, parts: [{ text: 'Understood! I am Zano AI Assistant, ready to help users with the Zano Finance Autopilot app.' }] },
            ...history,
            { role: 'user' as const, parts: [{ text: message }] },
        ];

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: contents,
        });

        const text = response.text || '';

        return new Response(JSON.stringify({ response: text }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error: any) {
        console.error('Chat error:', error);
        return new Response(
            JSON.stringify({
                error: 'Chat failed',
                message: error.message
            }),
            {
                status: 500,
                headers: { 'Content-Type': 'application/json' },
            }
        );
    }
}
