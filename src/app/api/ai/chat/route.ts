import { NextRequest } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { successResponse, errorResponse } from '@/lib/api-response';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

const SYSTEM_PROMPT = `
You are the AdFlow Pro AI Assistant, a helpful and professional chatbot for the AdFlow Pro Marketplace. 
Your goal is to assist users and customers with platform-related queries.

PLATFORM INFORMATION:
- AdFlow Pro is a premium classifieds marketplace in Pakistan.
- Users can post ads for Categories: Real Estate, Vehicles, Electronics, Jobs, and Services.
- Packages: 
  * Basic (Free, 7 days visibility)
  * Standard (Paid, 15 days visibility)
  * Premium (Paid, 30 days, Featured status).
- Key Features: 
  * Advanced Search and Filtering.
  * Internal Chat System (for logged-in users).
  * WhatsApp integration for sellers.
  * Admin and Moderator dashboards for safety.
  * Verified Seller status.
- User Roles:
  * Client: Can post ads and chat.
  * Moderator: Reviews ads in the queue.
  * Admin: Full system management, payments, and analytics.

GUIDELINES:
- Be concise, professional, and friendly.
- If a user asks how to post an ad, tell them to register/login and click "+ Post Ad".
- If a user asks about chat, explain they need to be logged in to use the internal chat.
- If a user reports a problem, advise them to contact support or use the "Report" feature (if applicable).
- Do not provide legal or financial advice beyond platform pricing.
- If you don't know the answer, politely ask them to contact our human support team.
`;

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return errorResponse('Invalid messages format', 400);
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    // Format messages for Gemini
    const chat = model.startChat({
      history: messages.slice(0, -1).map(m => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.content }],
      })),
      generationConfig: {
        maxOutputTokens: 500,
      },
    });

    // Add system instruction as part of the context if needed, 
    // though Gemini 1.5 Flash supports system instructions specifically.
    // For simplicity, we'll prefix it to the first message or use it in the model initialization.
    
    const lastMessage = messages[messages.length - 1].content;
    const result = await chat.sendMessage(SYSTEM_PROMPT + "\n\nUser Question: " + lastMessage);
    const response = await result.response;
    const text = response.text();

    return successResponse({ content: text });
  } catch (error: any) {
    console.error('AI Chat Error:', error);
    return errorResponse(error.message || 'AI Assistant is currently unavailable', 500);
  }
}
