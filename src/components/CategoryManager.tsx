import React, { useState } from 'react';
import { Category, MenuItem } from '../types';
import {
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  Utensils,
  Sparkles,
  Flame,
  CircleDot,
  Layers,
  Pizza,
  Soup,
  ChefHat,
  Zap,
  Drumstick,
  Coffee,
  IceCream,
  Sandwich,
  Wine,
  Apple,
  Cookie,
  LucideIcon,
} from 'lucide-react';
import { playTapSound } from '../utils/sound';

interface CategoryManagerProps {
  categories: Category[];
  menuItems: MenuItem[];
  onAddCategory: (name: string, iconName: string) => void;
  onDeleteCategory: (id: string) => void;
  onUpdateCategory?: (id: string, name: string, iconName: string) => void;
  onResetCategories?: () => void;
}

export const AVAILABLE_CATEGORY_ICONS: { name: string; icon: LucideIcon }[] = [
  { name: 'Utensils', icon: Utensils },
  { name: 'Sparkles', icon: Sparkles },
  { name: 'Flame', icon: Flame },
  { name: 'Pizza', icon: Pizza },
  { name: 'Soup', icon: Soup },
  { name: 'ChefHat', icon: ChefHat },
  { name: 'CircleDot', icon: CircleDot },
  { name: 'Layers', icon: Layers },
  { name: 'Zap', icon: Zap },
  { name: 'Drumstick', icon: Drumstick },
  { name: 'Coffee', icon: Coffee },
  { name: 'IceCream', icon: IceCream },
  { name: 'Sandwich', icon: Sandwich },
  { name: 'Wine', icon: Wine },
  { name: 'Apple', icon: Apple },
  { name: 'Cookie', icon: Cookie },
];

export const getCategoryIconComponent = (iconName: string): LucideIcon => {
  const found = AVAILABLE_CATEGORY_ICONS.find((i) => i.name === iconName);
  return found ? found.icon : Utensils;
};

export const CategoryManager: React.FC<CategoryManagerProps> = ({
  categories,
  menuItems,
  onAddCategory,
  onDeleteCategory,
  onUpdateCategory,
  onResetCategories,
}) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatIcon, setNewCatIcon] = useState('Utensils');
  const [errorMsg, setErrorMsg] = useState('');

  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editIcon, setEditIcon] = useState('Utensils');

  // Count items per category
  const itemCounts: Record<string, number> = {};
  categories.forEach((cat) => {
    if (cat.id === 'all') {
      itemCounts[cat.id] = menuItems.length;
    } else {
      itemCounts[cat.id] = menuItems.filter((i) => i.category === cat.id).length;
    }
  });

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) {
      setErrorMsg('Please enter a category name');
      return;
    }

    const trimmed = newCatName.trim();
    if (categories.some((c) => c.name.toLowerCase() === trimmed.toLowerCase())) {
      setErrorMsg('A category with this name already exists');
      return;
    }

    onAddCategory(trimmed, newCatIcon);
    playTapSound();
    setNewCatName('');
    setNewCatIcon('Utensils');
    setErrorMsg('');
    setIsAddModalOpen(false);
  };

  const handleStartEdit = (cat: Category) => {
    setEditingCatId(cat.id);
    setEditName(cat.name);
    setEditIcon(cat.iconName);
    playTapSound();
  };

  const handleSaveEdit = (catId: string) => {
    if (!editName.trim()) return;
    if (onUpdateCategory) {
      onUpdateCategory(catId, editName.trim(), editIcon);
    }
    setEditingCatId(null);
    playTapSound();
  };

  return (
    <div id="category-manager-container" className="space-y-4">
      {/* Header & Add Trigger */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-[#d8d6d3] shadow-soft">
        <div>
          <h3 className="text-base font-bold text-[#516B84] font-['Outfit']">
            Menu Categories ({categories.length - 1} active)
          </h3>
          <p className="text-xs text-slate-500">
            Create new custom categories to organize food items and navigation tabs.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="admin-add-category-btn"
            type="button"
            onClick={() => {
              setIsAddModalOpen(true);
              setErrorMsg('');
              playTapSound();
            }}
            className="py-2 px-3.5 rounded-xl bg-[#516B84] text-white text-xs sm:text-sm font-semibold hover:bg-[#3E5367] transition-colors shadow-xs flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Category</span>
          </button>

          {onResetCategories && (
            <button
              type="button"
              onClick={() => {
                if (window.confirm('Reset all categories back to default list?')) {
                  onResetCategories();
                }
              }}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors border border-slate-200 text-xs"
              title="Reset default categories"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        {categories.map((cat) => {
          const IconComp = getCategoryIconComponent(cat.iconName);
          const isAll = cat.id === 'all';
          const count = itemCounts[cat.id] || 0;
          const isEditing = editingCatId === cat.id;

          return (
            <div
              key={cat.id}
              id={`admin-category-card-${cat.id}`}
              className="bg-white rounded-xl p-3.5 border border-[#d8d6d3] shadow-xs flex flex-col justify-between"
            >
              {isEditing ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-[#516B84] text-white flex items-center justify-center shrink-0">
                      {React.createElement(getCategoryIconComponent(editIcon), { className: 'w-4 h-4' })}
                    </div>
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="flex-1 text-xs font-semibold px-2 py-1 border border-slate-300 rounded-lg focus:outline-none focus:border-[#516B84]"
                      placeholder="Category Name"
                    />
                  </div>

                  {/* Icon Selector inline */}
                  <div className="flex flex-wrap gap-1 pt-1 max-h-24 overflow-y-auto">
                    {AVAILABLE_CATEGORY_ICONS.map((item) => {
                      const Icon = item.icon;
                      return (
                        <button
                          key={item.name}
                          type="button"
                          onClick={() => setEditIcon(item.name)}
                          className={`p-1 rounded border text-xs ${
                            editIcon === item.name
                              ? 'bg-[#516B84] text-white border-[#516B84]'
                              : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                          title={item.name}
                        >
                          <Icon className="w-3 h-3" />
                        </button>
                      );
                    })}
                  </div>

                  <div className="flex justify-end gap-1.5 pt-1">
                    <button
                      type="button"
                      onClick={() => setEditingCatId(null)}
                      className="p-1 rounded text-slate-500 hover:bg-slate-100"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSaveEdit(cat.id)}
                      className="px-2 py-1 rounded bg-[#516B84] text-white text-xs font-semibold flex items-center gap-1"
                    >
                      <Check className="w-3 h-3" />
                      Save
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-[#EBF0F5] text-[#516B84] flex items-center justify-center shrink-0">
                      <IconComp className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h4 className="font-bold text-xs sm:text-sm text-slate-800 font-['Outfit'] truncate">
                          {cat.name}
                        </h4>
                        {isAll && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-500 font-medium">
                            System
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500">
                        {count} item{count === 1 ? '' : 's'} assigned
                      </p>
                    </div>
                  </div>

                  {!isAll && (
                    <div className="flex items-center gap-1 shrink-0">
                      {onUpdateCategory && (
                        <button
                          type="button"
                          onClick={() => handleStartEdit(cat)}
                          className="p-1 text-slate-400 hover:text-[#516B84] rounded-lg hover:bg-slate-100 transition-colors"
                          title="Edit category"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          if (
                            count > 0 &&
                            !window.confirm(
                              `There are ${count} items in "${cat.name}". Are you sure you want to delete this category?`
                            )
                          ) {
                            return;
                          }
                          onDeleteCategory(cat.id);
                          playTapSound();
                        }}
                        className="p-1 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                        title="Delete category"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Add Category Modal */}
      {isAddModalOpen && (
        <div
          id="add-category-modal-overlay"
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 animate-fadeIn"
          onClick={() => setIsAddModalOpen(false)}
        >
          <div
            id="add-category-modal"
            className="w-full max-w-sm bg-white rounded-2xl p-4 shadow-soft-lg border border-[#d8d6d3] animate-scaleUp"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-3">
              <h3 className="font-bold text-sm text-[#516B84] font-['Outfit'] flex items-center gap-1.5">
                <Plus className="w-4 h-4" />
                <span>Create New Category</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Category Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Desserts, Rolls, Shakes, Thali"
                  value={newCatName}
                  onChange={(e) => {
                    setNewCatName(e.target.value);
                    setErrorMsg('');
                  }}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:border-[#516B84] font-medium"
                  autoFocus
                />
                {errorMsg && <p className="text-[11px] text-red-600 mt-1">{errorMsg}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Select Category Icon
                </label>
                <div className="grid grid-cols-4 gap-1.5 max-h-36 overflow-y-auto p-1 bg-slate-50 rounded-xl border border-slate-200">
                  {AVAILABLE_CATEGORY_ICONS.map((item) => {
                    const Icon = item.icon;
                    const isSelected = newCatIcon === item.name;
                    return (
                      <button
                        key={item.name}
                        type="button"
                        onClick={() => setNewCatIcon(item.name)}
                        className={`p-2 rounded-lg flex flex-col items-center gap-1 text-[10px] font-medium transition-all ${
                          isSelected
                            ? 'bg-[#516B84] text-white shadow-xs'
                            : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span className="truncate max-w-[50px]">{item.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl bg-[#516B84] text-white text-xs font-semibold hover:bg-[#3E5367] transition-colors shadow-md flex items-center justify-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create Category</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
