export interface FoodImagePreset {
  category: string;
  name: string;
  keywords: string[];
  primary: string;
  gallery: string[];
}

export const FOOD_IMAGE_CATALOG: FoodImagePreset[] = [
  // Chaat
  {
    category: 'chaat',
    name: 'Special Dahi Puri',
    keywords: ['dahi', 'puri', 'chaat', 'golgappa', 'curd', 'sweet'],
    primary: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=800&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?auto=format&fit=crop&w=800&q=80',
    ],
  },
  {
    category: 'chaat',
    name: 'Mumbai Pani Puri',
    keywords: ['pani', 'puri', 'golgappe', 'puchka', 'spicy', 'mint', 'water'],
    primary: 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?auto=format&fit=crop&w=800&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=800&q=80',
    ],
  },
  {
    category: 'chaat',
    name: 'Sev Puri / Bhel Puri',
    keywords: ['sev', 'bhel', 'chaat', 'papdi', 'crispy', 'chutney'],
    primary: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=800&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=800&q=80',
    ],
  },
  {
    category: 'chaat',
    name: 'Aloo Tikki Chaat',
    keywords: ['aloo', 'tikki', 'chole', 'ragda', 'chaat', 'spicy'],
    primary: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=800&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=800&q=80',
    ],
  },

  // Pav Bhaji
  {
    category: 'pav-bhaji',
    name: 'Butter Pav Bhaji',
    keywords: ['pav', 'bhaji', 'butter', 'amul', 'masala', 'mumbai'],
    primary: 'https://images.unsplash.com/photo-1606491956689-2ea866880c84?auto=format&fit=crop&w=800&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1606491956689-2ea866880c84?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?auto=format&fit=crop&w=800&q=80',
    ],
  },
  {
    category: 'pav-bhaji',
    name: 'Cheese Pav Bhaji',
    keywords: ['cheese', 'pav', 'bhaji', 'loaded', 'masala'],
    primary: 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?auto=format&fit=crop&w=800&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1606491956689-2ea866880c84?auto=format&fit=crop&w=800&q=80',
    ],
  },

  // Momos
  {
    category: 'momos',
    name: 'Steamed Momos',
    keywords: ['momos', 'steamed', 'dumplings', 'dimsum', 'veg', 'paneer'],
    primary: 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?auto=format&fit=crop&w=800&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=800&q=80',
    ],
  },
  {
    category: 'momos',
    name: 'Kurkure / Crispy Fried Momos',
    keywords: ['kurkure', 'fried', 'crispy', 'momos', 'crunchy', 'spicy'],
    primary: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=800&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1496116218417-1a781b1c416c?auto=format&fit=crop&w=800&q=80',
    ],
  },
  {
    category: 'momos',
    name: 'Tandoori / Gravy Momos',
    keywords: ['tandoori', 'gravy', 'afghani', 'momos', 'spicy', 'marinated'],
    primary: 'https://images.unsplash.com/photo-1496116218417-1a781b1c416c?auto=format&fit=crop&w=800&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1496116218417-1a781b1c416c?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?auto=format&fit=crop&w=800&q=80',
    ],
  },

  // Burger
  {
    category: 'burger',
    name: 'Crispy Veg Burger',
    keywords: ['burger', 'veg', 'crispy', 'patty', 'lettuce', 'mayo'],
    primary: 'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=800&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80',
    ],
  },
  {
    category: 'burger',
    name: 'Cheese & Paneer Burger',
    keywords: ['paneer', 'cheese', 'burger', 'loaded', 'double', 'patty'],
    primary: 'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?auto=format&fit=crop&w=800&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=800&q=80',
    ],
  },
  {
    category: 'burger',
    name: 'Spicy Peri Peri Burger',
    keywords: ['peri', 'peri', 'spicy', 'chipotle', 'burger'],
    primary: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?auto=format&fit=crop&w=800&q=80',
    ],
  },

  // Sandwich
  {
    category: 'sandwich',
    name: 'Grilled Club Sandwich',
    keywords: ['sandwich', 'grilled', 'club', 'cheese', 'toast', 'jumbo'],
    primary: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=800&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1553909489-cd47e0907980?auto=format&fit=crop&w=800&q=80',
    ],
  },
  {
    category: 'sandwich',
    name: 'Cheese Corn / Paneer Sandwich',
    keywords: ['corn', 'paneer', 'tikka', 'cheese', 'sandwich', 'grilled'],
    primary: 'https://images.unsplash.com/photo-1553909489-cd47e0907980?auto=format&fit=crop&w=800&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1553909489-cd47e0907980?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1619860860774-1e2e17343432?auto=format&fit=crop&w=800&q=80',
    ],
  },

  // Pizza
  {
    category: 'pizza',
    name: 'Cheesy Veggie Delight Pizza',
    keywords: ['pizza', 'cheese', 'mozzarella', 'corn', 'capsicum', 'crust'],
    primary: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=800&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1604382355076-af4b0eb60143?auto=format&fit=crop&w=800&q=80',
    ],
  },
  {
    category: 'pizza',
    name: 'BBQ Chicken / Paneer Tikka Pizza',
    keywords: ['chicken', 'paneer', 'tikka', 'bbq', 'pizza', 'spicy'],
    primary: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=800&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=800&q=80',
    ],
  },

  // Chinese
  {
    category: 'chinese',
    name: 'Veg Hakka Noodles',
    keywords: ['noodles', 'chowmein', 'hakka', 'wok', 'chinese', 'veggies'],
    primary: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&w=800&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1603133872878-684f208fb84b?auto=format&fit=crop&w=800&q=80',
    ],
  },
  {
    category: 'chinese',
    name: 'Schezwan Fried Rice & Manchurian',
    keywords: ['rice', 'fried', 'schezwan', 'manchurian', 'spicy', 'chinese'],
    primary: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?auto=format&fit=crop&w=800&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1603133872878-684f208fb84b?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=800&q=80',
    ],
  },

  // Chicken
  {
    category: 'chicken',
    name: 'Crispy Chicken Wings & Lollipop',
    keywords: ['chicken', 'lollipop', 'wings', 'drumsticks', 'crispy', 'fried'],
    primary: 'https://images.unsplash.com/photo-1567620832903-9fc6debc209f?auto=format&fit=crop&w=800&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1567620832903-9fc6debc209f?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&w=800&q=80',
    ],
  },
  {
    category: 'chicken',
    name: 'Chicken Shawarma / Popcorn',
    keywords: ['shawarma', 'popcorn', 'roll', 'wrap', 'bites', 'chicken'],
    primary: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&w=800&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1567620832903-9fc6debc209f?auto=format&fit=crop&w=800&q=80',
    ],
  },

  // Fries & Sides
  {
    category: 'fries',
    name: 'Cheesy & Peri Peri Fries',
    keywords: ['fries', 'french', 'potatoes', 'cheese', 'peri', 'loaded'],
    primary: 'https://images.unsplash.com/photo-1576107232684-1279f3908594?auto=format&fit=crop&w=800&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1576107232684-1279f3908594?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1585109649139-366815a0d713?auto=format&fit=crop&w=800&q=80',
    ],
  },

  // Beverages & Shakes
  {
    category: 'beverages',
    name: 'Cold Coffee / Milkshake with Ice Cream',
    keywords: ['coffee', 'cold', 'shake', 'chocolate', 'oreo', 'icecream', 'frappe'],
    primary: 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?auto=format&fit=crop&w=800&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1553787499-6f9133860278?auto=format&fit=crop&w=800&q=80',
    ],
  },
  {
    category: 'beverages',
    name: 'Special Masala Chai / Kulhad Tea',
    keywords: ['tea', 'chai', 'masala', 'kulhad', 'hot', 'ginger', 'cardamom'],
    primary: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=800&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=800&q=80',
    ],
  },
  {
    category: 'beverages',
    name: 'Mango Lassi & Royal Falooda',
    keywords: ['lassi', 'mango', 'falooda', 'dessert', 'sweet', 'yogurt', 'kulfi'],
    primary: 'https://images.unsplash.com/photo-1528751014936-863e6e7a319c?auto=format&fit=crop&w=800&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1528751014936-863e6e7a319c?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1563805042-7684c019e1cb?auto=format&fit=crop&w=800&q=80',
    ],
  },
  {
    category: 'beverages',
    name: 'Fresh Mojito / Lemon Soda',
    keywords: ['mojito', 'soda', 'lemon', 'lime', 'mint', 'cooler', 'mocktail'],
    primary: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=800&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=800&q=80',
    ],
  },
];

/**
 * Finds best matching high quality food images based on dish name, description, and category
 */
export function findBestFoodImages(
  name: string,
  category?: string,
  description?: string
): { primary: string; gallery: string[] } {
  const query = `${name} ${category || ''} ${description || ''}`.toLowerCase();

  let bestMatch = FOOD_IMAGE_CATALOG[0];
  let highestScore = -1;

  for (const preset of FOOD_IMAGE_CATALOG) {
    let score = 0;
    if (category && preset.category.toLowerCase() === category.toLowerCase()) {
      score += 5;
    }
    for (const kw of preset.keywords) {
      if (query.includes(kw.toLowerCase())) {
        score += 3;
      }
    }
    if (preset.name.toLowerCase().includes(name.toLowerCase()) || name.toLowerCase().includes(preset.name.toLowerCase())) {
      score += 8;
    }

    if (score > highestScore) {
      highestScore = score;
      bestMatch = preset;
    }
  }

  return {
    primary: bestMatch.primary,
    gallery: bestMatch.gallery,
  };
}
