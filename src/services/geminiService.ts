import { DocType } from "../types";
import { withRetry } from "./retryHelper";
import { errorService } from "./errorService";
import { API_CONFIG } from "../config/constants";

export interface ClassificationResult {
  type: DocType;
  vendorName: string;
  amount?: string;
  currency?: string;
  date?: string;
  reasoning?: string;
  confidence?: number; // Confidence score 0-100
}

// Check if we're in production (Vercel) or development
const isProduction = import.meta.env.PROD;
const API_PROXY_URL = '/api/classify';

export class GeminiService {
  private useProxy: boolean;

  constructor() {
    // In production, always use the proxy to keep API key server-side
    // In development, can use direct calls if proxy isn't running
    this.useProxy = isProduction;
  }

  async classifyEmailContent(
    subject: string,
    snippet: string,
    fileName?: string
  ): Promise<ClassificationResult | null> {
    try {
      // In production, ALWAYS use the proxy.
      // In development, usage depends on configuration but defaults to proxy if available.
      if (this.useProxy) {
        return await this.classifyViaProxy(subject, snippet, fileName);
      } else {
        // Only allow direct calls in development
        if (isProduction) {
          console.warn('Attempted direct API call in production. Redirecting to proxy.');
          return await this.classifyViaProxy(subject, snippet, fileName);
        }
        return await this.classifyDirectly(subject, snippet, fileName);
      }
    } catch (error: unknown) {
      const appError = errorService.handleError(error, "document classification");
      console.error("Gemini classification failed:", appError.userMessage);
      return null;
    }
  }

  private async classifyViaProxy(
    subject: string,
    snippet: string,
    fileName?: string
  ): Promise<ClassificationResult | null> {
    const result = await withRetry(
      async () => {
        const response = await fetch(API_PROXY_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ subject, snippet, fileName }),
        });

        if (!response.ok) {
          const error = await response.json().catch(() => ({}));
          throw new Error(error.message || `API error: ${response.status}`);
        }

        return response.json() as Promise<ClassificationResult>;
      },
      {
        maxAttempts: API_CONFIG.MAX_RETRIES,
        baseDelayMs: API_CONFIG.BASE_DELAY_MS,
        maxDelayMs: API_CONFIG.MAX_DELAY_MS,
      }
    );

    return result;
  }

  private async classifyDirectly(
    subject: string,
    snippet: string,
    fileName?: string
  ): Promise<ClassificationResult | null> {
    // Dynamic import to avoid loading SDK in production
    const { GoogleGenAI, Type } = await import("@google/genai");

    const apiKey = (import.meta.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY) as string;
    if (!apiKey) {
      console.warn('No Gemini API key found. Classification disabled.');
      return null;
    }

    const ai = new GoogleGenAI({ apiKey });

    const prompt = `
      Analyze the following email metadata and determine if it contains a financial document.
      Subject: "${subject}"
      Snippet: "${snippet}"
      Attachment Name: "${fileName || 'None'}"

      Classify it into one of: INVOICE, BANK_STATEMENT, RECEIPT, TAX_LETTER, or OTHER.
      Also extract the Vendor/Sender Name, estimated Amount, and Currency if possible.
      
      Provide a confidence score (0-100) indicating how certain you are about this classification.
      Higher scores mean higher confidence in the classification accuracy.
    `;

    const result = await withRetry(
      async () => {
        const response = await ai.models.generateContent({
          model: API_CONFIG.GEMINI_MODEL,
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                type: {
                  type: Type.STRING,
                  enum: Object.values(DocType),
                },
                vendorName: { type: Type.STRING },
                amount: { type: Type.STRING },
                currency: { type: Type.STRING },
                reasoning: { type: Type.STRING },
                confidence: { type: Type.NUMBER },
              },
              required: ["type", "vendorName", "confidence"],
            },
          },
        });

        const text = response.text || "{}";
        return JSON.parse(this.cleanJsonString(text)) as ClassificationResult;
      },
      {
        maxAttempts: API_CONFIG.MAX_RETRIES,
        baseDelayMs: API_CONFIG.BASE_DELAY_MS,
        maxDelayMs: API_CONFIG.MAX_DELAY_MS,
      }
    );

    return result;
  }

  private cleanJsonString(text: string): string {
    // Remove markdown code blocks if present (e.g. ```json ... ```)
    const match = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (match) {
      return match[1];
    }
    return text;
  }

  async analyzeImage(
    imageBase64: string,
    mimeType: string
  ): Promise<ClassificationResult | null> {
    try {
      // Dynamic import
      const { GoogleGenAI, Type } = await import("@google/genai");

      const apiKey = (import.meta.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY) as string;
      if (!apiKey) {
        console.warn('No Gemini API key found. Image analysis disabled.');
        return null;
      }

      const ai = new GoogleGenAI({ apiKey });

      const prompt = `
        Analyze this image. It is likely a receipt, invoice, or financial document.
        Extract the following details:
        - Type: (INVOICE, RECEIPT, BANK_STATEMENT, OTHER)
        - Vendor Name: The merchant or sender.
        - Amount: The total amount.
        - Currency: The currency code (e.g. USD, ZAR).
        - Date: The transaction date (YYYY-MM-DD).
        - Reasoning: Brief explanation of classification.
        - Confidence: A score from 0-100 indicating certainty about the classification.
      `;

      const result = await withRetry(
        async () => {
          const response = await ai.models.generateContent({
            model: API_CONFIG.GEMINI_MODEL,
            contents: [
              { text: prompt },
              {
                inlineData: {
                  mimeType: mimeType,
                  data: imageBase64
                }
              }
            ],
            config: {
              responseMimeType: "application/json",
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  type: {
                    type: Type.STRING,
                    enum: Object.values(DocType),
                  },
                  vendorName: { type: Type.STRING },
                  amount: { type: Type.STRING },
                  currency: { type: Type.STRING },
                  date: { type: Type.STRING },
                  reasoning: { type: Type.STRING },
                  confidence: { type: Type.NUMBER },
                },
                required: ["type", "vendorName", "amount", "confidence"],
              },
            },
          });

          const text = response.text || "{}";
          return JSON.parse(this.cleanJsonString(text)) as ClassificationResult;
        },
        {
          maxAttempts: API_CONFIG.MAX_RETRIES,
          baseDelayMs: API_CONFIG.BASE_DELAY_MS,
          maxDelayMs: API_CONFIG.MAX_DELAY_MS,
        }
      );

      return result;

    } catch (error: unknown) {
      const appError = errorService.handleError(error, "image analysis");
      console.error("Gemini image analysis failed:", appError.userMessage);
      return null;
    }
  }

  async generateDailyReportSummary(
    docsCount: number,
    vendors: string[]
  ): Promise<string> {
    // For now, return a simple template - can add AI summary later via proxy
    return `Daily report processed successfully. ${docsCount} documents from ${vendors.length} vendors have been filed in your Google Drive.`;
  }
}

export const geminiService = new GeminiService();
