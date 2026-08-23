import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// Lazy initialize Gemini client
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

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

/**
 * AI Endpoint: Generate or enhance a single dish with Gemini
 */
app.post('/api/ai/generate-dish', async (req, res) => {
  try {
    const { prompt, category, isVeg } = req.body;
    const ai = getGeminiClient();

    if (!ai) {
      return res.status(200).json({
        success: false,
        fallback: true,
        message: 'Gemini API key is not configured. Using intelligent smart generator.',
      });
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

    return res.json({
      success: true,
      dish: parsedData,
    });
  } catch (error: any) {
    console.error('Error generating dish with Gemini:', error);
    return res.status(500).json({
      success: false,
      error: error?.message || 'Failed to generate dish with Gemini AI',
    });
  }
});

/**
 * AI Endpoint: Generate multiple trending dishes at once
 */
app.post('/api/ai/suggest-menu', async (req, res) => {
  try {
    const { theme = 'trending street food and cafe snacks', count = 4 } = req.body;
    const ai = getGeminiClient();

    if (!ai) {
      return res.status(200).json({
        success: false,
        fallback: true,
        message: 'Gemini API key is not configured. Using offline smart templates.',
      });
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

    return res.json({
      success: true,
      dishes: Array.isArray(items) ? items : [items],
    });
  } catch (error: any) {
    console.error('Error generating menu batch with Gemini:', error);
    return res.status(500).json({
      success: false,
      error: error?.message || 'Failed to generate menu suggestions',
    });
  }
});

// Vite middleware setup
async function start() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

start();
