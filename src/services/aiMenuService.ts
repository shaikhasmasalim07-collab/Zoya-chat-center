import { MenuItem, CategoryId } from '../types';
import { findBestFoodImages, FOOD_IMAGE_CATALOG } from '../data/foodImageLibrary';

export interface AiGeneratedDish {
  name: string;
  description: string;
  price: number;
  category: CategoryId;
  image: string;
  images: string[];
  isVeg: boolean;
  isSpicy?: boolean;
  isPopular?: boolean;
  preparationTime?: number;
  tags?: string[];
}

export const SMART_FALLBACK_TEMPLATES: Array<Omit<AiGeneratedDish, 'image' | 'images'> & { imageKeywords: string }> = [
  {
    name: 'Tandoori Kurkure Momos',
    description: 'Crisp cornflake-crusted momos tossed in a smoky clay-oven tandoori marinade, topped with chaat masala & mint mayo.',
    price: 120,
    category: 'momos',
    isVeg: true,
    isSpicy: true,
    isPopular: true,
    preparationTime: 10,
    imageKeywords: 'momos',
  },
  {
    name: 'Cheesy Garlic Breadsticks',
    description: 'Freshly baked buttery garlic loaf smothered with golden melted mozzarella cheese and Italian herb dust.',
    price: 99,
    category: 'pizza',
    isVeg: true,
    isSpicy: false,
    isPopular: true,
    preparationTime: 8,
    imageKeywords: 'pizza',
  },
  {
    name: 'Double Tikki Paneer Burger',
    description: 'Crisp golden herb potato patty stacked with grilled cottage cheese slice, caramelized onions, and signature secret burger relish.',
    price: 129,
    category: 'burger',
    isVeg: true,
    isSpicy: false,
    isPopular: true,
    preparationTime: 10,
    imageKeywords: 'burger',
  },
  {
    name: 'Hazelnut Cold Coffee Frappe',
    description: 'Velvety espresso blended with roasted hazelnut syrup, chilled creamy milk, chocolate drizzle, and vanilla bean gelato.',
    price: 75,
    category: 'beverages',
    isVeg: true,
    isSpicy: false,
    isPopular: true,
    preparationTime: 5,
    imageKeywords: 'coffee',
  },
  {
    name: 'Chicken Shawarma Roll',
    description: 'Thin Lebanese rumali wrap stuffed with slow-roasted spiced chicken strips, crunchy pickled cucumbers, and authentic garlic toum.',
    price: 130,
    category: 'chicken',
    isVeg: false,
    isSpicy: true,
    isPopular: true,
    preparationTime: 10,
    imageKeywords: 'chicken',
  },
  {
    name: 'Cheese Loaded Nachos & Fries',
    description: 'Crisp seasoned fries & tortilla chips drenched in warm queso cheese sauce, fresh pico de gallo, and sliced pickled jalapeños.',
    price: 110,
    category: 'fries',
    isVeg: true,
    isSpicy: true,
    isPopular: true,
    preparationTime: 7,
    imageKeywords: 'fries',
  },
  {
    name: 'Royal Kesariya Falooda',
    description: 'Chilled condensed saffron milk layered with chewy basil seeds, rose syrup, silky vermicelli noodles, and kulfi scoop.',
    price: 80,
    category: 'beverages',
    isVeg: true,
    isSpicy: false,
    isPopular: true,
    preparationTime: 5,
    imageKeywords: 'falooda',
  },
  {
    name: 'Crispy Veg Schezwan Noodles',
    description: 'High-flame wok-charred noodles tossed with fiery garlic Schezwan paste, bell peppers, carrots, and crispy fried wonton ribbons.',
    price: 110,
    category: 'chinese',
    isVeg: true,
    isSpicy: true,
    isPopular: true,
    preparationTime: 9,
    imageKeywords: 'noodles',
  },
];

class AiMenuService {
  /**
   * Generates a single dish using Gemini AI API with perfect image mapping
   */
  async generateDish(params: {
    prompt: string;
    category?: string;
    isVeg?: boolean;
  }): Promise<AiGeneratedDish> {
    try {
      const res = await fetch('/api/ai/generate-dish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.dish) {
          const raw = data.dish;
          const { primary, gallery } = findBestFoodImages(
            raw.name || params.prompt,
            raw.category || params.category,
            raw.description
          );

          return {
            name: raw.name || params.prompt,
            description: raw.description || 'Authentic freshly prepared specialty dish with signature herbs and sauces.',
            price: typeof raw.price === 'number' ? raw.price : 80,
            category: (raw.category as CategoryId) || 'chaat',
            image: primary,
            images: gallery,
            isVeg: raw.isVeg !== undefined ? raw.isVeg : (params.isVeg ?? true),
            isSpicy: !!raw.isSpicy,
            isPopular: raw.isPopular !== undefined ? raw.isPopular : true,
            preparationTime: raw.preparationTime || 8,
            tags: raw.tags || ['Chef Special'],
          };
        }
      }
    } catch (e) {
      console.warn('Backend Gemini call failed, generating smart dish fallback:', e);
    }

    // Fallback if offline or API key pending
    return this.generateSmartFallback(params.prompt, params.category, params.isVeg);
  }

  /**
   * Generates a batch of trending dishes for the restaurant
   */
  async suggestTrendingDishes(theme: string = 'trending street food', count: number = 4): Promise<AiGeneratedDish[]> {
    try {
      const res = await fetch('/api/ai/suggest-menu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ theme, count }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.dishes) && data.dishes.length > 0) {
          return data.dishes.map((raw: any) => {
            const { primary, gallery } = findBestFoodImages(raw.name, raw.category, raw.description);
            return {
              name: raw.name,
              description: raw.description,
              price: typeof raw.price === 'number' ? raw.price : 90,
              category: (raw.category as CategoryId) || 'chaat',
              image: primary,
              images: gallery,
              isVeg: raw.isVeg !== undefined ? raw.isVeg : true,
              isSpicy: !!raw.isSpicy,
              isPopular: raw.isPopular !== undefined ? raw.isPopular : true,
              preparationTime: raw.preparationTime || 8,
            };
          });
        }
      }
    } catch (e) {
      console.warn('Suggest dishes API failed, using smart presets:', e);
    }

    // Fallback presets
    const shuffled = [...SMART_FALLBACK_TEMPLATES].sort(() => 0.5 - Math.random()).slice(0, count);
    return shuffled.map((tpl) => {
      const { primary, gallery } = findBestFoodImages(tpl.name, tpl.category, tpl.description);
      return {
        ...tpl,
        image: primary,
        images: gallery,
      };
    });
  }

  private generateSmartFallback(prompt: string, category?: string, isVeg?: boolean): AiGeneratedDish {
    const cleanPrompt = prompt.trim();
    const { primary, gallery } = findBestFoodImages(cleanPrompt, category);

    // Derive category if not specified
    let targetCategory: CategoryId = (category as CategoryId) || 'chaat';
    const lower = cleanPrompt.toLowerCase();
    if (lower.includes('momo') || lower.includes('dumpling')) targetCategory = 'momos';
    else if (lower.includes('burger') || lower.includes('patty')) targetCategory = 'burger';
    else if (lower.includes('pizza') || lower.includes('slice')) targetCategory = 'pizza';
    else if (lower.includes('sandwich') || lower.includes('toast')) targetCategory = 'sandwich';
    else if (lower.includes('pav') || lower.includes('bhaji')) targetCategory = 'pav-bhaji';
    else if (lower.includes('noodle') || lower.includes('rice') || lower.includes('manchurian') || lower.includes('chinese')) targetCategory = 'chinese';
    else if (lower.includes('chicken') || lower.includes('shawarma') || lower.includes('wings')) targetCategory = 'chicken';
    else if (lower.includes('fries') || lower.includes('nachos') || lower.includes('nugget')) targetCategory = 'fries';
    else if (lower.includes('chai') || lower.includes('tea') || lower.includes('coffee') || lower.includes('lassi') || lower.includes('shake') || lower.includes('soda')) targetCategory = 'beverages';

    const isNonVeg = lower.includes('chicken') || lower.includes('egg') || lower.includes('meat') || (isVeg === false);

    return {
      name: cleanPrompt ? this.capitalize(cleanPrompt) : 'Chef Special Delicacy',
      description: `Delicious freshly crafted ${cleanPrompt || 'speciality'} layered with aromatic chef's spice blend, signature sauces, and authentic garnishes.`,
      price: targetCategory === 'beverages' ? 60 : targetCategory === 'pizza' || targetCategory === 'chicken' ? 140 : 90,
      category: targetCategory,
      image: primary,
      images: gallery,
      isVeg: !isNonVeg,
      isSpicy: lower.includes('spicy') || lower.includes('peri') || lower.includes('tandoori') || lower.includes('schezwan'),
      isPopular: true,
      preparationTime: targetCategory === 'beverages' ? 4 : 8,
    };
  }

  private capitalize(str: string): string {
    return str
      .split(' ')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(' ');
  }
}

export const aiMenuService = new AiMenuService();
