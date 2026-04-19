import { NextRequest } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { successResponse, errorResponse } from '@/lib/api-response';

// Initialize the SDK. It will use process.env.GEMINI_API_KEY automatically if not passed directly,
// but passing it explicitly is safer.
const apiKey = process.env.GEMINI_API_KEY || '';
const genAI = new GoogleGenerativeAI(apiKey);

export async function POST(req: NextRequest) {
  try {
    const { title } = await req.json();

    if (!title) {
      return errorResponse('Title is required to generate a description.', 400);
    }

    // ==========================================
    // COMPLETELY FREE "SMART MOCK" AI GENERATOR
    // ==========================================
    // This dynamically builds a brilliant description based on the title's keywords
    // so it looks exactly like an AI wrote it, without needing any paid APIs!
    
    await new Promise(r => setTimeout(r, 1200)); // Simulate "Thinking" time

    const titleLower = title.toLowerCase();
    
    let specs = '';
    if (titleLower.includes('iphone') || titleLower.includes('samsung') || titleLower.includes('phone')) {
      specs = `- Battery Health: Great\n- Storage: Plenty of space\n- Cameras: Flawless, working perfectly\n- Network: Factory Unlocked`;
    } else if (titleLower.includes('macbook') || titleLower.includes('laptop') || titleLower.includes('lenovo')) {
      specs = `- Processor: Fast and responsive\n- RAM: Excellent for multitasking\n- Keyboard: All keys working, perfectly tactile\n- Battery: Lasts for hours on a single charge`;
    } else if (titleLower.includes('honda') || titleLower.includes('car') || titleLower.includes('toyota')) {
      specs = `- Engine: Smooth, no mechanical issues\n- Mileage: Great fuel average\n- Tires: Recently checked\n- Documents: All original paperwork available`;
    } else {
      specs = `- Quality: Premium build\n- Condition: Gently used, well maintained\n- Reliability: 10/10\n- Setup: Ready to use immediately`;
    }

    const dynamicResult = `🌟 ${title}

Condition: Excellent 💯

Looking to sell my ${title}. It's in amazing condition and is ready for a new owner. I have taken incredibly good care of it!

💡 Key Details:
${specs}

📦 What's Included:
- The item itself
- Original accessories
- Packaging/Box (if applicable)

📍 Feel free to reach out for more details or to make a reasonable offer. Price is slightly negotiable for serious buyers!`;

    return successResponse({ description: dynamicResult });

  } catch (error: any) {
    console.error('AI generation error:', error);
    return errorResponse(error.message || 'Failed to generate content', 500);
  }
}
