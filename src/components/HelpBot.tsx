import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Loader2, Bot, User, Sparkles } from 'lucide-react';
import { API_CONFIG } from '../config/constants';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
}

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

const HelpBot: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        {
            id: '1',
            role: 'assistant',
            content: "Hi! 👋 I'm Zano AI. I can help you navigate the app, add suppliers, or answer questions. What would you like to do?",
            timestamp: new Date(),
        },
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen]);


    const sendMessage = async () => {
        if (!input.trim() || isLoading) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: input.trim(),
            timestamp: new Date(),
        };

        setMessages((prev) => [...prev, userMessage]);
        const userInput = input.trim();
        setInput('');
        setIsLoading(true);

        try {
            // Build conversation history for context
            const history = messages.map((m) => ({
                role: m.role === 'assistant' ? 'model' : 'user',
                parts: [{ text: m.content }],
            }));

            let text = '';

            // In production, use the proxy to keep API key server-side
            if (import.meta.env.PROD) {
                const response = await fetch('/api/chat', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ message: userInput, history }),
                });

                if (!response.ok) {
                    const error = await response.json().catch(() => ({}));
                    throw new Error(error.message || `API error: ${response.status}`);
                }

                const data = await response.json();
                text = data.response || '';
            } else {
                // In development, use direct API calls
                const { GoogleGenAI } = await import('@google/genai');
                const apiKey = (import.meta.env.VITE_GEMINI_API_KEY || '') as string;

                if (!apiKey) {
                    throw new Error('Gemini API key not configured. Please add VITE_GEMINI_API_KEY to your .env file.');
                }

                const ai = new GoogleGenAI({ apiKey });

                // Build full conversation with context
                const contents = [
                    { role: 'user', parts: [{ text: APP_CONTEXT }] },
                    { role: 'model', parts: [{ text: 'Understood! I am Zano AI Assistant, ready to help users with the Zano Finance Autopilot app.' }] },
                    ...history,
                    { role: 'user', parts: [{ text: userInput }] },
                ];

                const response = await ai.models.generateContent({
                    model: API_CONFIG.GEMINI_MODEL,
                    contents: contents,
                });

                text = response.text || '';
            }

            const assistantMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: text || "I'm sorry, I couldn't process that. Please try again.",
                timestamp: new Date(),
            };

            setMessages((prev) => [...prev, assistantMessage]);
        } catch (error: any) {
            console.error('Chat error:', error);
            const errorMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: `Sorry, I encountered an error: ${error.message || 'Please try again.'} 🔄`,
                timestamp: new Date(),
            };
            setMessages((prev) => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    return (
        <>
            {/* Chat Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                aria-label={isOpen ? 'Close chat assistant' : 'Open chat assistant'}
                aria-expanded={isOpen}
                className={`fixed bottom-6 right-6 z-50 p-3 md:p-4 rounded-full shadow-lg transition-all duration-300 ${isOpen
                    ? 'bg-slate-700 hover:bg-slate-800 scale-90'
                    : 'bg-indigo-600 hover:bg-indigo-700 hover:scale-110'
                    }`}
            >
                {isOpen ? (
                    <X className="w-6 h-6 text-white" />
                ) : (
                    <MessageCircle className="w-6 h-6 text-white" />
                )}
            </button>

            {/* Chat Window */}
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="helpbot-title"
                className={`fixed bottom-24 right-6 z-50 w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden transition-all duration-300 ${isOpen
                    ? 'opacity-100 translate-y-0 pointer-events-auto'
                    : 'opacity-0 translate-y-4 pointer-events-none'
                    }`}
            >
                {/* Header */}
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-4 flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center" aria-hidden="true">
                        <Sparkles className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h3 id="helpbot-title" className="font-bold text-white">Zano AI Assistant</h3>
                        <p className="text-white/70 text-xs">Ask me anything about the app</p>
                    </div>
                </div>

                {/* Messages */}
                <div className="h-80 overflow-y-auto p-4 space-y-4 bg-slate-50">
                    {messages.map((message) => (
                        <div
                            key={message.id}
                            className={`flex gap-2 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                            {message.role === 'assistant' && (
                                <div className="w-7 h-7 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
                                    <Bot className="w-4 h-4 text-indigo-600" />
                                </div>
                            )}
                            <div
                                className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm ${message.role === 'user'
                                    ? 'bg-indigo-600 text-white rounded-br-md'
                                    : 'bg-white text-slate-700 border border-slate-200 rounded-bl-md shadow-sm'
                                    }`}
                            >
                                {message.content}
                            </div>
                            {message.role === 'user' && (
                                <div className="w-7 h-7 bg-indigo-600 rounded-full flex items-center justify-center flex-shrink-0">
                                    <User className="w-4 h-4 text-white" />
                                </div>
                            )}
                        </div>
                    ))}
                    {isLoading && (
                        <div className="flex gap-2 justify-start">
                            <div className="w-7 h-7 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
                                <Bot className="w-4 h-4 text-indigo-600" />
                            </div>
                            <div className="bg-white px-4 py-2.5 rounded-2xl rounded-bl-md border border-slate-200 shadow-sm">
                                <Loader2 className="w-4 h-4 text-indigo-600 animate-spin" />
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="p-4 bg-white border-t border-slate-100">
                    <div className="flex gap-2">
                        <input
                            ref={inputRef}
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyPress={handleKeyPress}
                            placeholder="Type a message..."
                            aria-label="Type a message to the AI assistant"
                            className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                            disabled={isLoading}
                        />
                        <button
                            onClick={sendMessage}
                            disabled={!input.trim() || isLoading}
                            aria-label="Send message"
                            className="p-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Send className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};

export default HelpBot;
