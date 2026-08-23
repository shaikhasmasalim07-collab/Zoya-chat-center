import React, { useState } from 'react';
import { MenuItem, CategoryId, Category } from '../types';
import {
  Plus,
  Edit2,
  Trash2,
  Check,
  X,
  RotateCcw,
  Sparkles,
  Flame,
  Eye,
  EyeOff,
  Camera,
  Wand2,
  Zap,
  Loader2,
  RefreshCw,
  Search,
  ImageIcon,
} from 'lucide-react';
import { ImageUploadDropzone } from './ImageUploadDropzone';
import { playTapSound } from '../utils/sound';
import { aiMenuService, AiGeneratedDish, SMART_FALLBACK_TEMPLATES } from '../services/aiMenuService';
import { FOOD_IMAGE_CATALOG, findBestFoodImages } from '../data/foodImageLibrary';

interface MenuManagerProps {
  items: MenuItem[];
  categories?: Category[];
  onAddItem: (item: Omit<MenuItem, 'id'>) => void;
  onUpdateItem: (item: MenuItem) => void;
  onDeleteItem: (id: string) => void;
  onToggleAvailability: (id: string) => void;
  onResetMenu: () => void;
  onAddCategory?: (name: string, iconName: string) => void;
}

const IMAGE_PRESETS = [
  { name: 'Dahi Puri', url: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=800&q=80' },
  { name: 'Pani Puri', url: 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?auto=format&fit=crop&w=800&q=80' },
  { name: 'Sev Puri', url: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=800&q=80' },
  { name: 'Pav Bhaji', url: 'https://images.unsplash.com/photo-1606491956689-2ea866880c84?auto=format&fit=crop&w=800&q=80' },
  { name: 'Burger', url: 'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=800&q=80' },
  { name: 'Sandwich', url: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=800&q=80' },
  { name: 'Pizza', url: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=800&q=80' },
  { name: 'Momos', url: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=800&q=80' },
  { name: 'Noodles', url: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&w=800&q=80' },
  { name: 'Fries', url: 'https://images.unsplash.com/photo-1576107232684-1279f3908594?auto=format&fit=crop&w=800&q=80' },
  { name: 'Chai & Shake', url: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=800&q=80' },
];

const AI_QUICK_IDEAS = [
  '🥟 Tandoori Kurkure Momos',
  '🍕 Cheesy Garlic Breadsticks',
  '🍔 Double Tikki Paneer Burger',
  '🥪 Cheese Corn Grilled Sandwich',
  '☕ Hazelnut Cold Coffee Frappe',
  '🍹 Royal Kesariya Falooda',
  '🍟 Mexican Loaded Cheesy Fries',
  '🍗 Crispy Chicken Shawarma Roll',
];

export const MenuManager: React.FC<MenuManagerProps> = ({
  items,
  categories = [],
  onAddItem,
  onUpdateItem,
  onDeleteItem,
  onToggleAvailability,
  onResetMenu,
  onAddCategory,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isEditingModalOpen, setIsEditingModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);

  // Quick category add inside modal
  const [isQuickAddCategoryOpen, setIsQuickAddCategoryOpen] = useState(false);
  const [quickCatName, setQuickCatName] = useState('');

  // Form states for Add / Edit
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formPrice, setFormPrice] = useState('80');
  const [formCategory, setFormCategory] = useState<CategoryId>('chaat');
  const [formImages, setFormImages] = useState<string[]>([IMAGE_PRESETS[0].url]);
  const [formIsVeg, setFormIsVeg] = useState(true);
  const [formIsPopular, setFormIsPopular] = useState(false);
  const [formIsSpicy, setFormIsSpicy] = useState(false);
  const [formPrepTime, setFormPrepTime] = useState('8');
  const [isAiAutofilling, setIsAiAutofilling] = useState(false);

  // AI Modal States
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiCategory, setAiCategory] = useState<string>('any');
  const [aiIsVeg, setAiIsVeg] = useState(true);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [generatedDish, setGeneratedDish] = useState<AiGeneratedDish | null>(null);
  const [aiSuccessMsg, setAiSuccessMsg] = useState<string | null>(null);

  const filteredItems = items.filter(
    (item) => selectedCategory === 'all' || item.category === selectedCategory
  );

  const activeCategories =
    categories.length > 0
      ? categories
      : [
          { id: 'all', name: 'All', iconName: 'Utensils' },
          { id: 'chaat', name: 'Chaat', iconName: 'Sparkles' },
          { id: 'pav-bhaji', name: 'Pav Bhaji', iconName: 'Flame' },
          { id: 'chinese', name: 'Chinese', iconName: 'CircleDot' },
          { id: 'momos', name: 'Momos', iconName: 'Layers' },
          { id: 'pizza', name: 'Pizza', iconName: 'Pizza' },
          { id: 'sandwich', name: 'Sandwich', iconName: 'Sandwich' },
          { id: 'burger', name: 'Burgers', iconName: 'Zap' },
          { id: 'chicken', name: 'Chicken Specials', iconName: 'Drumstick' },
          { id: 'fries', name: 'Fries & Sides', iconName: 'Soup' },
          { id: 'beverages', name: 'Beverages & Chai', iconName: 'Coffee' },
        ];

  const openAddModal = () => {
    setEditingItem(null);
    setFormName('');
    setFormDescription('');
    setFormPrice('80');
    const firstNonAll = activeCategories.find((c) => c.id !== 'all')?.id || 'chaat';
    setFormCategory(firstNonAll);
    setFormImages([IMAGE_PRESETS[0].url]);
    setFormIsVeg(true);
    setFormIsPopular(false);
    setFormIsSpicy(false);
    setFormPrepTime('8');
    setIsQuickAddCategoryOpen(false);
    setQuickCatName('');
    setIsEditingModalOpen(true);
    playTapSound();
  };

  const handleQuickAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickCatName.trim()) return;
    if (onAddCategory) {
      onAddCategory(quickCatName.trim(), 'Utensils');
      const slug = quickCatName.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
      setFormCategory(slug || `cat-${Date.now()}`);
    }
    setQuickCatName('');
    setIsQuickAddCategoryOpen(false);
  };

  const openEditModal = (item: MenuItem) => {
    setEditingItem(item);
    setFormName(item.name);
    setFormDescription(item.description);
    setFormPrice(item.price.toString());
    setFormCategory(item.category);

    const existingImages: string[] = [];
    if (item.images && item.images.length > 0) {
      existingImages.push(...item.images);
      if (item.image && !existingImages.includes(item.image)) {
        existingImages.unshift(item.image);
      }
    } else if (item.image) {
      existingImages.push(item.image);
    } else {
      existingImages.push(IMAGE_PRESETS[0].url);
    }
    setFormImages(existingImages);

    setFormIsVeg(item.isVeg);
    setFormIsPopular(!!item.isPopular);
    setFormIsSpicy(!!item.isSpicy);
    setFormPrepTime((item.preparationTime || 8).toString());
    setIsEditingModalOpen(true);
    playTapSound();
  };

  /**
   * Magic Wand AI Autofill inside standard Edit/Add Form
   */
  const handleAiAutofillInForm = async () => {
    if (!formName.trim()) {
      alert('Please enter a dish name first to autofill with AI.');
      return;
    }
    try {
      setIsAiAutofilling(true);
      const generated = await aiMenuService.generateDish({
        prompt: formName.trim(),
        category: formCategory !== 'all' ? formCategory : undefined,
        isVeg: formIsVeg,
      });

      if (generated) {
        setFormDescription(generated.description);
        setFormPrice(generated.price.toString());
        setFormCategory(generated.category);
        setFormIsVeg(generated.isVeg);
        setFormIsSpicy(!!generated.isSpicy);
        setFormIsPopular(!!generated.isPopular);
        setFormPrepTime((generated.preparationTime || 8).toString());
        if (generated.images && generated.images.length > 0) {
          setFormImages(generated.images);
        } else if (generated.image) {
          setFormImages([generated.image]);
        }
      }
    } catch (e) {
      console.warn('AI Autofill error:', e);
    } finally {
      setIsAiAutofilling(false);
    }
  };

  /**
   * AI Modal Generator Handler
   */
  const handleGenerateAiDish = async (customPrompt?: string) => {
    const promptToUse = customPrompt || aiPrompt;
    if (!promptToUse.trim()) return;

    try {
      setIsGeneratingAi(true);
      setGeneratedDish(null);
      setAiSuccessMsg(null);

      const res = await aiMenuService.generateDish({
        prompt: promptToUse.trim(),
        category: aiCategory !== 'any' ? aiCategory : undefined,
        isVeg: aiIsVeg,
      });

      setGeneratedDish(res);
      playTapSound();
    } catch (e) {
      console.error('Failed to generate AI dish:', e);
    } finally {
      setIsGeneratingAi(false);
    }
  };

  /**
   * Add the AI Generated Dish directly to live menu
   */
  const handleAddAiDishToMenu = () => {
    if (!generatedDish) return;

    onAddItem({
      name: generatedDish.name,
      description: generatedDish.description,
      price: generatedDish.price,
      category: generatedDish.category,
      image: generatedDish.image,
      images: generatedDish.images && generatedDish.images.length > 0 ? generatedDish.images : [generatedDish.image],
      isVeg: generatedDish.isVeg,
      isAvailable: true,
      isPopular: generatedDish.isPopular ?? true,
      isSpicy: generatedDish.isSpicy ?? false,
      preparationTime: generatedDish.preparationTime ?? 8,
    });

    setAiSuccessMsg(`✨ "${generatedDish.name}" added to menu successfully!`);
    playTapSound();

    setTimeout(() => {
      setGeneratedDish(null);
      setAiPrompt('');
      setAiSuccessMsg(null);
    }, 1800);
  };

  /**
   * Batch Add 4 Trending Items with AI
   */
  const handleBatchSuggestTrending = async () => {
    try {
      setIsGeneratingAi(true);
      const dishes = await aiMenuService.suggestTrendingDishes('top Indian street food, momos, burger and cafe snacks', 4);
      let count = 0;
      for (const d of dishes) {
        onAddItem({
          name: d.name,
          description: d.description,
          price: d.price,
          category: d.category,
          image: d.image,
          images: d.images && d.images.length > 0 ? d.images : [d.image],
          isVeg: d.isVeg,
          isAvailable: true,
          isPopular: d.isPopular ?? true,
          isSpicy: d.isSpicy ?? false,
          preparationTime: d.preparationTime ?? 8,
        });
        count++;
      }
      setAiSuccessMsg(`✨ Added ${count} trending dishes with HD photography!`);
      playTapSound();
      setTimeout(() => {
        setIsAiModalOpen(false);
        setAiSuccessMsg(null);
      }, 1500);
    } catch (e) {
      console.warn('Batch add failed:', e);
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const priceNum = parseFloat(formPrice) || 0;
    const prepNum = parseInt(formPrepTime, 10) || 8;

    if (!formName.trim()) return;

    const finalImages = formImages.length > 0 ? formImages : [IMAGE_PRESETS[0].url];
    const primaryImage = finalImages[0];

    if (editingItem) {
      onUpdateItem({
        ...editingItem,
        name: formName.trim(),
        description: formDescription.trim(),
        price: priceNum,
        category: formCategory,
        image: primaryImage,
        images: finalImages,
        isVeg: formIsVeg,
        isPopular: formIsPopular,
        isSpicy: formIsSpicy,
        preparationTime: prepNum,
      });
    } else {
      onAddItem({
        name: formName.trim(),
        description: formDescription.trim(),
        price: priceNum,
        category: formCategory,
        image: primaryImage,
        images: finalImages,
        isVeg: formIsVeg,
        isAvailable: true,
        isPopular: formIsPopular,
        isSpicy: formIsSpicy,
        preparationTime: prepNum,
      });
    }

    setIsEditingModalOpen(false);
    playTapSound();
  };

  return (
    <div id="menu-manager-container" className="space-y-6">
      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-[#d8d6d3] shadow-soft">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-[#516B84] font-['Outfit']">
              Food Menu Catalog ({items.length} items)
            </h3>
            <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
              Live Real-Time
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Add dishes with Gemini AI, upload multi-angle HD photography, and manage live pricing.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          {/* AI Dish Generator Button */}
          <button
            id="admin-ai-dish-creator-btn"
            type="button"
            onClick={() => {
              setIsAiModalOpen(true);
              setGeneratedDish(null);
              setAiSuccessMsg(null);
              playTapSound();
            }}
            className="py-2 px-3 rounded-xl bg-gradient-to-r from-amber-600 via-rose-600 to-indigo-600 text-white text-xs sm:text-sm font-bold hover:opacity-95 transition-all shadow-sm flex items-center gap-1.5 shrink-0"
          >
            <Sparkles className="w-4 h-4 animate-pulse" />
            <span>✨ AI Product Creator</span>
          </button>

          <button
            id="admin-add-food-btn"
            type="button"
            onClick={openAddModal}
            className="py-2 px-3 rounded-xl bg-[#516B84] text-white text-xs sm:text-sm font-semibold hover:bg-[#3E5367] transition-colors shadow-xs flex items-center gap-1.5 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Add Item</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (window.confirm('Reset menu back to full default catalog with HD photos?')) {
                onResetMenu();
              }
            }}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors border border-slate-200 text-xs flex items-center gap-1 shrink-0"
            title="Reset to default menu"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Reset</span>
          </button>
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
        {activeCategories.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors border ${
              selectedCategory === cat.id
                ? 'bg-[#516B84] text-white border-[#516B84]'
                : 'bg-white text-slate-700 border-[#d8d6d3] hover:bg-slate-50'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Items Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {filteredItems.map((item) => (
          <div
            key={item.id}
            id={`admin-menu-item-${item.id}`}
            className={`bg-white rounded-xl p-3.5 border transition-all flex items-center justify-between gap-3 shadow-xs ${
              !item.isAvailable
                ? 'border-red-200 bg-red-50/20'
                : 'border-[#d8d6d3] hover:border-[#516B84]/50'
            }`}
          >
            {/* Left Image & Info */}
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="relative shrink-0">
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-14 h-14 rounded-lg object-cover border border-slate-200 shadow-xs"
                />
                {item.images && item.images.length > 1 && (
                  <span className="absolute -bottom-1 -right-1 bg-[#516B84] text-white text-[9px] font-bold px-1 py-0.2 rounded-md shadow-xs flex items-center gap-0.5">
                    <Camera className="w-2.5 h-2.5" />
                    <span>{item.images.length}</span>
                  </span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span
                    className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                      item.isVeg ? 'bg-emerald-600' : 'bg-red-600'
                    }`}
                  />
                  <h4 className="text-sm font-bold text-slate-900 truncate font-['Outfit']">
                    {item.name}
                  </h4>
                </div>
                <p className="text-xs text-slate-500 truncate">{item.description}</p>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span className="text-xs font-bold text-[#516B84] font-['Outfit']">
                    ₹{item.price}
                  </span>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wide">
                    {item.category}
                  </span>
                  {item.images && item.images.length > 1 && (
                    <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded font-medium">
                      {item.images.length} photos
                    </span>
                  )}
                  {!item.isAvailable && (
                    <span className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.2 rounded font-semibold">
                      Out of Stock
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => onToggleAvailability(item.id)}
                title={item.isAvailable ? 'Mark as Out of Stock' : 'Mark as Available'}
                className={`p-2 rounded-lg text-xs font-medium border transition-colors ${
                  item.isAvailable
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                    : 'bg-slate-100 text-slate-500 border-slate-300 hover:bg-slate-200'
                }`}
              >
                {item.isAvailable ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4 text-red-500" />}
              </button>

              <button
                type="button"
                onClick={() => openEditModal(item)}
                className="p-2 rounded-lg bg-[#F7F7F6] text-slate-700 border border-[#d8d6d3] hover:bg-[#E6E5E4] hover:text-[#516B84] transition-colors"
                title="Edit item"
              >
                <Edit2 className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => {
                  if (window.confirm(`Delete "${item.name}" from the menu?`)) {
                    onDeleteItem(item.id);
                  }
                }}
                className="p-2 rounded-lg bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 transition-colors"
                title="Delete item"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* AI DISH GENERATOR MODAL */}
      {isAiModalOpen && (
        <div
          id="ai-menu-generator-modal-overlay"
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn"
          onClick={() => setIsAiModalOpen(false)}
        >
          <div
            className="w-full max-w-xl bg-white rounded-2xl shadow-soft-lg overflow-hidden border border-[#d8d6d3] animate-scaleUp max-h-[92vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-4 bg-gradient-to-r from-[#516B84] to-[#2E4256] text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-white/10 backdrop-blur-sm flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-amber-300" />
                </div>
                <div>
                  <h3 className="text-base font-bold font-['Outfit'] flex items-center gap-1.5">
                    AI Food Product Creator
                    <span className="text-[10px] bg-amber-400/20 text-amber-200 font-semibold px-2 py-0.5 rounded-full border border-amber-300/30">
                      Gemini Powered
                    </span>
                  </h3>
                  <p className="text-xs text-slate-200">
                    Create delicious items with pricing, description & authentic HD food photos.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAiModalOpen(false)}
                className="p-1 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto flex-1">
              {/* Quick AI Ideas Chips */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5 flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5 text-amber-500" />
                  <span>Trending AI Dish Prompts (1-Click)</span>
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {AI_QUICK_IDEAS.map((idea, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        const clean = idea.replace(/^[^\w]+/, '').trim();
                        setAiPrompt(clean);
                        handleGenerateAiDish(clean);
                      }}
                      className="px-2.5 py-1 text-xs bg-[#F7F7F6] hover:bg-slate-200 text-slate-800 border border-[#d8d6d3] rounded-lg transition-colors"
                    >
                      {idea}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Prompt Input */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Custom Dish Prompt or Flavor Description
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleGenerateAiDish();
                      }
                    }}
                    placeholder="e.g. Cheese loaded Tandoori Momos, Crunchy Mexican Fries, etc."
                    className="flex-1 px-3.5 py-2 text-xs bg-[#F7F7F6] border border-[#d8d6d3] rounded-xl focus:outline-none focus:border-[#516B84] focus:bg-white"
                  />
                  <button
                    type="button"
                    disabled={isGeneratingAi || !aiPrompt.trim()}
                    onClick={() => handleGenerateAiDish()}
                    className="px-4 py-2 bg-[#516B84] hover:bg-[#3E5367] text-white text-xs font-bold rounded-xl disabled:opacity-50 flex items-center gap-1.5 shrink-0 shadow-xs"
                  >
                    {isGeneratingAi ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Wand2 className="w-4 h-4" />
                    )}
                    <span>Generate</span>
                  </button>
                </div>
              </div>

              {/* Preferences */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">
                    Target Category
                  </label>
                  <select
                    value={aiCategory}
                    onChange={(e) => setAiCategory(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-[#F7F7F6] border border-[#d8d6d3] rounded-lg focus:outline-none"
                  >
                    <option value="any">Auto-Detect by AI</option>
                    {activeCategories
                      .filter((c) => c.id !== 'all')
                      .map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                  </select>
                </div>

                <div className="flex items-end">
                  <label className="flex items-center gap-2 p-2 w-full rounded-lg bg-[#F7F7F6] border border-[#d8d6d3] text-xs cursor-pointer">
                    <input
                      type="checkbox"
                      checked={aiIsVeg}
                      onChange={(e) => setAiIsVeg(e.target.checked)}
                      className="rounded text-emerald-600 focus:ring-0"
                    />
                    <span className="font-semibold text-slate-800">Pure Vegetarian Dish</span>
                  </label>
                </div>
              </div>

              {/* Success Notification */}
              {aiSuccessMsg && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-fadeIn">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{aiSuccessMsg}</span>
                </div>
              )}

              {/* Generated Dish Preview Card */}
              {generatedDish && (
                <div className="p-4 rounded-xl border border-indigo-100 bg-indigo-50/40 space-y-3 animate-fadeIn">
                  <div className="flex items-center justify-between border-b border-indigo-100 pb-2">
                    <span className="text-xs font-bold text-indigo-900 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      Generated Recipe & Presentation
                    </span>
                    <span className="text-[11px] font-bold text-[#516B84] uppercase">
                      Category: {generatedDish.category}
                    </span>
                  </div>

                  <div className="flex gap-3">
                    <img
                      src={generatedDish.image}
                      alt={generatedDish.name}
                      className="w-20 h-20 rounded-xl object-cover border border-slate-200 shadow-xs shrink-0"
                    />
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-bold text-slate-900 font-['Outfit']">
                          {generatedDish.name}
                        </h4>
                        <span className="text-sm font-bold text-[#516B84]">
                          ₹{generatedDish.price}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 line-clamp-2">
                        {generatedDish.description}
                      </p>
                      <div className="flex items-center gap-2 pt-1">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            generatedDish.isVeg
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {generatedDish.isVeg ? 'Veg' : 'Non-Veg'}
                        </span>
                        {generatedDish.isSpicy && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-100 text-orange-800 flex items-center gap-0.5">
                            <Flame className="w-2.5 h-2.5" /> Spicy
                          </span>
                        )}
                        <span className="text-[10px] text-slate-500">
                          ⏱ {generatedDish.preparationTime || 8} mins
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Multi-angle Photos Gallery */}
                  {generatedDish.images && generatedDish.images.length > 1 && (
                    <div className="pt-2">
                      <label className="text-[11px] font-bold text-slate-600 block mb-1 flex items-center gap-1">
                        <ImageIcon className="w-3 h-3 text-[#516B84]" />
                        <span>Included High-Definition Angle Photos ({generatedDish.images.length})</span>
                      </label>
                      <div className="flex gap-2 overflow-x-auto pb-1">
                        {generatedDish.images.map((imgUrl, i) => (
                          <img
                            key={i}
                            src={imgUrl}
                            alt={`Angle ${i + 1}`}
                            onClick={() => {
                              setGeneratedDish({
                                ...generatedDish,
                                image: imgUrl,
                              });
                            }}
                            className={`w-12 h-12 rounded-lg object-cover border cursor-pointer transition-all ${
                              generatedDish.image === imgUrl
                                ? 'border-[#516B84] ring-2 ring-[#516B84]/40 scale-105'
                                : 'border-slate-200 opacity-75 hover:opacity-100'
                            }`}
                            title="Click to set as primary cover photo"
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-2 border-t border-indigo-100">
                    <button
                      type="button"
                      onClick={handleAddAiDishToMenu}
                      className="flex-1 py-2 px-4 bg-[#516B84] hover:bg-[#3E5367] text-white text-xs font-bold rounded-xl shadow-xs flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add This Dish to Live Menu</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleGenerateAiDish()}
                      className="p-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs"
                      title="Re-generate with AI"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer with Batch Add Option */}
            <div className="p-4 bg-slate-50 border-t border-[#d8d6d3] flex items-center justify-between">
              <button
                type="button"
                disabled={isGeneratingAi}
                onClick={handleBatchSuggestTrending}
                className="text-xs font-bold text-[#516B84] hover:text-[#3E5367] flex items-center gap-1.5 transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Auto-Add 4 Trending Street Food Specials</span>
              </button>

              <button
                type="button"
                onClick={() => setIsAiModalOpen(false)}
                className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STANDARD ADD / EDIT MODAL */}
      {isEditingModalOpen && (
        <div
          id="menu-edit-modal-overlay"
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn"
          onClick={() => setIsEditingModalOpen(false)}
        >
          <div
            className="w-full max-w-lg bg-white rounded-2xl shadow-soft-lg overflow-hidden border border-[#d8d6d3] animate-scaleUp p-5 max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="text-lg font-bold text-[#516B84] font-['Outfit']">
                  {editingItem ? 'Edit Food Item' : 'Add New Food Item'}
                </h3>
                <p className="text-xs text-slate-500">
                  Update dish details or use AI magic wand to auto-fill description & photos.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsEditingModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4 overflow-y-auto pr-1 flex-grow">
              {/* Name with AI Auto-Fill & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-700 block">
                      Food Name *
                    </label>
                    <button
                      type="button"
                      disabled={isAiAutofilling || !formName.trim()}
                      onClick={handleAiAutofillInForm}
                      className="text-[11px] text-amber-700 hover:text-amber-800 font-bold flex items-center gap-0.5 disabled:opacity-40"
                      title="Use AI to generate description, price & photos"
                    >
                      {isAiAutofilling ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Wand2 className="w-3 h-3 text-amber-600" />
                      )}
                      <span>AI Fill</span>
                    </button>
                  </div>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g. Special Pav Bhaji"
                    className="w-full px-3 py-2 text-xs bg-[#F7F7F6] border border-[#d8d6d3] rounded-lg focus:outline-none focus:border-[#516B84]"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-700 block">
                      Category *
                    </label>
                    {onAddCategory && (
                      <button
                        type="button"
                        onClick={() => setIsQuickAddCategoryOpen(!isQuickAddCategoryOpen)}
                        className="text-[11px] text-[#516B84] hover:underline font-semibold flex items-center gap-0.5"
                      >
                        <Plus className="w-3 h-3" />
                        <span>New</span>
                      </button>
                    )}
                  </div>

                  {isQuickAddCategoryOpen ? (
                    <div className="flex gap-1.5 items-center">
                      <input
                        type="text"
                        placeholder="New category name"
                        value={quickCatName}
                        onChange={(e) => setQuickCatName(e.target.value)}
                        className="flex-1 px-2.5 py-1.5 text-xs bg-white border border-[#516B84] rounded-lg focus:outline-none"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={handleQuickAddCategory}
                        className="px-2 py-1.5 bg-[#516B84] text-white text-xs font-semibold rounded-lg shrink-0"
                      >
                        Add
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsQuickAddCategoryOpen(false)}
                        className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg shrink-0"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <select
                      value={formCategory}
                      onChange={(e) => setFormCategory(e.target.value as CategoryId)}
                      className="w-full px-3 py-2 text-xs bg-[#F7F7F6] border border-[#d8d6d3] rounded-lg focus:outline-none focus:border-[#516B84]"
                    >
                      {activeCategories
                        .filter((c) => c.id !== 'all')
                        .map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                    </select>
                  )}
                </div>
              </div>

              {/* Price & Prep Time */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Price (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    max="9999"
                    value={formPrice}
                    onChange={(e) => setFormPrice(e.target.value)}
                    placeholder="79"
                    className="w-full px-3 py-2 text-xs bg-[#F7F7F6] border border-[#d8d6d3] rounded-lg focus:outline-none focus:border-[#516B84]"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Est. Prep Time (mins)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="60"
                    value={formPrepTime}
                    onChange={(e) => setFormPrepTime(e.target.value)}
                    placeholder="8"
                    className="w-full px-3 py-2 text-xs bg-[#F7F7F6] border border-[#d8d6d3] rounded-lg focus:outline-none focus:border-[#516B84]"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Describe ingredients, tastes, and portions..."
                  className="w-full px-3 py-2 text-xs bg-[#F7F7F6] border border-[#d8d6d3] rounded-lg focus:outline-none focus:border-[#516B84]"
                />
              </div>

              {/* Drag and Drop Multi-Image Upload Area */}
              <div>
                <ImageUploadDropzone
                  images={formImages}
                  onChange={(newImgs) => setFormImages(newImgs)}
                  multiple={true}
                  maxImages={6}
                  label="Product Photos (Multi-angle HD Food Photography)"
                  description="Upload photos or select from presets. The first image (⭐) is used as the primary menu cover."
                  presets={IMAGE_PRESETS}
                  helperText="Supported formats: JPG, PNG, WebP. Photos are automatically compressed for high performance."
                />
              </div>

              {/* Dietary & Highlight Toggles */}
              <div className="pt-2 border-t border-slate-100 grid grid-cols-3 gap-2">
                <label className="flex items-center gap-2 p-2 rounded-lg bg-[#F7F7F6] border border-[#d8d6d3] text-xs cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formIsVeg}
                    onChange={(e) => setFormIsVeg(e.target.checked)}
                    className="rounded text-[#516B84] focus:ring-0"
                  />
                  <span className="font-semibold text-slate-800">Pure Veg</span>
                </label>

                <label className="flex items-center gap-2 p-2 rounded-lg bg-[#F7F7F6] border border-[#d8d6d3] text-xs cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formIsPopular}
                    onChange={(e) => setFormIsPopular(e.target.checked)}
                    className="rounded text-[#516B84] focus:ring-0"
                  />
                  <span className="font-semibold text-slate-800">Popular</span>
                </label>

                <label className="flex items-center gap-2 p-2 rounded-lg bg-[#F7F7F6] border border-[#d8d6d3] text-xs cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formIsSpicy}
                    onChange={(e) => setFormIsSpicy(e.target.checked)}
                    className="rounded text-[#516B84] focus:ring-0"
                  />
                  <span className="font-semibold text-slate-800">Spicy</span>
                </label>
              </div>

              {/* Submit Buttons */}
              <div className="pt-4 border-t border-slate-100 flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setIsEditingModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-white bg-[#516B84] hover:bg-[#3E5367] rounded-xl shadow-xs"
                >
                  {editingItem ? 'Save Changes' : 'Create Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
