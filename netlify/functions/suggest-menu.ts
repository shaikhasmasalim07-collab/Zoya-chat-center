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
    const { theme = 'trending street food and cafe snacks', count = 4 } = payload;
    const ai = getGeminiClient();

    if (!ai) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: false,
          fallback: true,
          message: 'Gemini API key is not configured in Netlify environment variables.',
        }),
      };
    }

    const systemInstruction = `You are a culinary curator for Zoya Chat Center (specializing in Chaat, Momos, Burgers, Pizzas, Sandwiches, Pav Bhaji, Chinese, Chicken & Beverages).
Generate exactly ${count} highly trending, high-selling food dishes in JSON array format.`;

    const userPrompt = `Create ${count} trending, innovative and delicious dishes for theme: "${theme}".
Return pure JSON array of dishes:
[
  {
    "name": "Dish Name",
    "description": "Appetizing description",
    "price": 120,
    "category": "chaat|pav-bhaji|burger|sandwich|pizza|momos|chinese|fries|chicken|beverages",
    "isVeg": true,
    "isSpicy": true,
    "isPopular": true,
    "preparationTime": 10,
    "imageKeyword": "momos|chaat|burger|pizza|sandwich|noodles|tea|coffee|fries|chicken"
  }
]`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.7-flash',
      contents: userPrompt,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        temperature: 0.8,
      },
    });

    const text = response.text?.trim() || '[]';
    const items = JSON.parse(text);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        dishes: Array.isArray(items) ? items : [items],
      }),
    };
  } catch (error: any) {
    console.error('Error in Netlify suggest-menu function:', error);
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: false,
        error: error?.message || 'Failed to generate menu suggestions',
        fallback: true,
      }),
    };
  }
}
