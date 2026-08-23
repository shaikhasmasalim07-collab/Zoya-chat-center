import { GoogleGenAI } from '@google/genai';

function getGeminiClient(): GoogleGenAI | null {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return null;
  return new GoogleGenAI({
    apiKey: key,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

export async function handler(event: { body?: string | null }) {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  try {
    const payload = event.body ? JSON.parse(event.body) : {};
    const { prompt, category, isVeg } = payload;
    const ai = getGeminiClient();

    if (!ai) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: false,
          fallback: true,
          message: 'Gemini API key is not configured in Netlify environment variables. Using smart dish fallback generator.',
        }),
      };
    }

    const systemInstruction = `You are an elite Indian Street Food & Fast Food Chef and Restaurant Menu Consultant for "Zoya Chat Center".
Generate a realistic, mouthwatering, authentic menu item for the restaurant in JSON format.
Ensure prices are in realistic Indian Rupees (₹20 to ₹250).
The categories must be one of: "chaat", "pav-bhaji", "burger", "sandwich", "pizza", "momos", "chinese", "fries", "chicken", "beverages".
Write evocative, sensory culinary descriptions mentioning signature chutneys, cheeses, marinades, herbs, or cooking techniques.`;

    const userPrompt = `Generate a single culinary dish for our menu based on this input:
Input prompt: "${prompt || 'Special Chef Special Dish'}"
Preferred Category: "${category || 'any'}"
Vegetarian: ${isVeg !== undefined ? isVeg : 'auto-detect'}

Respond with pure JSON strictly matching this structure:
{
  "name": "Dish Name (Title Case)",
  "description": "Sensory, appetizing 1-2 sentence description",
  "price": 80,
  "category": "chaat|pav-bhaji|burger|sandwich|pizza|momos|chinese|fries|chicken|beverages",
  "isVeg": true,
  "isSpicy": false,
  "isPopular": true,
  "preparationTime": 8,
  "tags": ["Cheesy", "Chef Special"],
  "imageKeyword": "momos|chaat|burger|pizza|sandwich|noodles|tea|coffee|fries|chicken"
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.7-flash',
      contents: userPrompt,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        temperature: 0.7,
      },
    });

    const text = response.text?.trim() || '{}';
    const parsedData = JSON.parse(text);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        dish: parsedData,
      }),
    };
  } catch (error: any) {
    console.error('Error in Netlify generate-dish function:', error);
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: false,
        error: error?.message || 'Failed to generate dish',
        fallback: true,
      }),
    };
  }
}
