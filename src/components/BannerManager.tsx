import React, { useState, useEffect } from 'react';
import { PromoBanner } from '../types';
import { bannerService } from '../services/bannerService';
import {
  Image as ImageIcon,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  XCircle,
  Eye,
  Sparkles,
  X,
  AlertCircle,
} from 'lucide-react';
import { ImageUploadDropzone } from './ImageUploadDropzone';
import { playTapSound } from '../utils/sound';

const PRESET_BANNER_IMAGES = [
  { name: 'Dahi Puri & Chaat', url: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600&auto=format&fit=crop&q=80' },
  { name: 'Special Burger', url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&auto=format&fit=crop&w=80' },
  { name: 'Pav Bhaji Feast', url: 'https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=600&auto=format&fit=crop&q=80' },
  { name: 'Steamy Momos', url: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=600&auto=format&fit=crop&q=80' },
  { name: 'Crispy Sandwich', url: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=600&auto=format&fit=crop&q=80' },
];

const PRESET_GRADIENTS = [
  { label: 'Deep Slate Navy', value: 'from-[#516B84] to-[#2B3A48]' },
  { label: 'Amber Spice', value: 'from-amber-700 to-amber-900' },
  { label: 'Emerald Mint', value: 'from-emerald-800 to-teal-950' },
  { label: 'Ruby Crimson', value: 'from-rose-800 to-red-950' },
  { label: 'Midnight Indigo', value: 'from-indigo-900 to-slate-950' },
];

export const BannerManager: React.FC = () => {
  const [banners, setBanners] = useState<PromoBanner[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<PromoBanner | null>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [tag, setTag] = useState('⚡ Chef Special');
  const [bgGradient, setBgGradient] = useState('from-[#516B84] to-[#2B3A48]');
  const [imageUrl, setImageUrl] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    const unsub = bannerService.subscribe((list) => {
      setBanners(list);
    });
    return () => unsub();
  }, []);

  const handleOpenAdd = () => {
    setEditingBanner(null);
    setTitle('');
    setSubtitle('');
    setTag('⚡ Chef Special');
    setBgGradient('from-[#516B84] to-[#2B3A48]');
    setImageUrl('https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600&auto=format&fit=crop&q=80');
    setIsActive(true);
    setFormError('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (b: PromoBanner) => {
    setEditingBanner(b);
    setTitle(b.title);
    setSubtitle(b.subtitle);
    setTag(b.tag || '');
    setBgGradient(b.bgGradient);
    setImageUrl(b.imageUrl || '');
    setIsActive(b.isActive);
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setFormError('Banner title is required.');
      return;
    }

    playTapSound();

    if (editingBanner) {
      await bannerService.updateBanner({
        id: editingBanner.id,
        title: title.trim(),
        subtitle: subtitle.trim(),
        tag: tag.trim() || undefined,
        bgGradient,
        imageUrl: imageUrl.trim() || undefined,
        isActive,
      });
    } else {
      await bannerService.addBanner({
        title: title.trim(),
        subtitle: subtitle.trim(),
        tag: tag.trim() || undefined,
        bgGradient,
        imageUrl: imageUrl.trim() || undefined,
        isActive,
      });
    }

    setIsModalOpen(false);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this promo banner?')) {
      playTapSound();
      await bannerService.deleteBanner(id);
    }
  };

  const handleToggleActive = async (id: string) => {
    playTapSound();
    await bannerService.toggleActive(id);
  };

  return (
    <div className="space-y-4">
      {/* Action Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-3.5 sm:p-4 rounded-xl border border-[#d8d6d3] shadow-soft">
        <div>
          <h3 className="text-sm sm:text-base font-bold text-[#516B84] font-['Outfit'] flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-[#516B84]" />
            <span>Promotional Banners Manager</span>
            <span className="text-xs font-semibold bg-[#EBF0F5] text-[#516B84] px-2 py-0.5 rounded-full">
              {banners.length} banners
            </span>
          </h3>
          <p className="text-xs text-slate-500">
            Showcase chef specials, discounts, and announcements on top of customer ordering screens.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenAdd}
          className="px-3 py-1.5 bg-[#516B84] hover:bg-[#3E5367] text-white text-xs font-semibold rounded-lg shadow-xs flex items-center gap-1.5 shrink-0 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Banner</span>
        </button>
      </div>

      {/* Banners Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {banners.map((banner) => (
          <div
            key={banner.id}
            className={`bg-white rounded-xl border overflow-hidden shadow-soft flex flex-col justify-between ${
              banner.isActive ? 'border-[#d8d6d3]' : 'border-slate-200 opacity-65'
            }`}
          >
            {/* Live Banner Visual Preview */}
            <div
              className={`relative bg-gradient-to-r ${banner.bgGradient} p-4 text-white overflow-hidden flex items-center justify-between gap-3`}
            >
              <div className="relative z-10 max-w-[65%] space-y-1">
                {banner.tag && (
                  <span className="inline-block bg-white/20 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                    {banner.tag}
                  </span>
                )}
                <h4 className="font-bold text-sm sm:text-base font-['Outfit'] leading-snug">
                  {banner.title}
                </h4>
                <p className="text-[11px] text-white/80 line-clamp-2 leading-relaxed">
                  {banner.subtitle}
                </p>
              </div>

              {banner.imageUrl && (
                <div className="w-20 h-20 rounded-xl overflow-hidden shadow-md shrink-0 border border-white/20">
                  <img
                    src={banner.imageUrl}
                    alt={banner.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
            </div>

            {/* Banner Controls */}
            <div className="p-3 bg-white flex items-center justify-between gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleToggleActive(banner.id)}
                className={`text-[11px] font-semibold px-2.5 py-1 rounded-full flex items-center gap-1 transition-colors ${
                  banner.isActive
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-slate-200 text-slate-600'
                }`}
              >
                {banner.isActive ? (
                  <>
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    Live on Menu
                  </>
                ) : (
                  <>
                    <XCircle className="w-3 h-3 text-slate-500" />
                    Inactive
                  </>
                )}
              </button>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleOpenEdit(banner)}
                  className="px-2 py-1 text-[#516B84] hover:bg-[#EBF0F5] rounded-lg transition-colors flex items-center gap-1 font-medium"
                >
                  <Edit2 className="w-3 h-3" />
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(banner.id)}
                  className="px-2 py-1 text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-1 font-medium"
                >
                  <Trash2 className="w-3 h-3" />
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}

        {banners.length === 0 && (
          <div className="col-span-full py-8 text-center bg-white rounded-xl border border-[#d8d6d3] p-4 text-xs text-slate-500">
            No promo banners yet. Click <strong>New Banner</strong> to highlight food combos and deals!
          </div>
        )}
      </div>

      {/* Add / Edit Banner Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="w-full max-w-lg bg-white rounded-2xl shadow-soft-lg overflow-hidden border border-[#d8d6d3] p-5 animate-scaleUp max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#516B84] text-white flex items-center justify-center">
                  <ImageIcon className="w-4 h-4" />
                </div>
                <h4 className="text-base font-bold text-[#516B84] font-['Outfit']">
                  {editingBanner ? 'Edit Promo Banner' : 'Create New Promo Banner'}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs mb-3 flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Banner Headline Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Special Dahi Puri & Pav Bhaji Combo"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full text-xs p-2.5 bg-[#F7F7F6] border border-[#d8d6d3] rounded-lg focus:outline-none focus:border-[#516B84]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Subtitle / Promo Details
                </label>
                <input
                  type="text"
                  placeholder="e.g. Crispy, freshly prepared & served hot to your table!"
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  className="w-full text-xs p-2.5 bg-[#F7F7F6] border border-[#d8d6d3] rounded-lg focus:outline-none focus:border-[#516B84]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Tag / Badge Text
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. ⚡ Chef Special or 🏷️ 20% OFF"
                    value={tag}
                    onChange={(e) => setTag(e.target.value)}
                    className="w-full text-xs p-2.5 bg-[#F7F7F6] border border-[#d8d6d3] rounded-lg focus:outline-none focus:border-[#516B84]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Background Color Theme
                  </label>
                  <select
                    value={bgGradient}
                    onChange={(e) => setBgGradient(e.target.value)}
                    className="w-full text-xs p-2.5 bg-[#F7F7F6] border border-[#d8d6d3] rounded-lg focus:outline-none focus:border-[#516B84]"
                  >
                    {PRESET_GRADIENTS.map((g) => (
                      <option key={g.value} value={g.value}>
                        {g.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <ImageUploadDropzone
                  images={imageUrl ? [imageUrl] : []}
                  onChange={(newImgs) => setImageUrl(newImgs[0] || '')}
                  multiple={false}
                  maxImages={1}
                  label="Banner Graphic / Food Photo (Drag & Drop or Upload)"
                  description="Drag & drop a photo from your phone/computer or choose a preset."
                  presets={PRESET_BANNER_IMAGES}
                  helperText="Supported formats: JPG, PNG, WebP. Photo will be displayed cleanly on the banner card."
                />
              </div>

              {/* Live Preview Box in Modal */}
              <div>
                <label className="block text-[11px] uppercase tracking-wider font-bold text-slate-500 mb-1.5">
                  Live Preview:
                </label>
                <div
                  className={`rounded-xl bg-gradient-to-r ${bgGradient} p-3 text-white flex items-center justify-between gap-3`}
                >
                  <div className="space-y-0.5">
                    {tag && (
                      <span className="inline-block bg-white/20 text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase">
                        {tag}
                      </span>
                    )}
                    <h5 className="font-bold text-xs font-['Outfit']">
                      {title || 'Your Banner Title'}
                    </h5>
                    <p className="text-[10px] text-white/80 line-clamp-1">
                      {subtitle || 'Your promotional subtitle text will appear here.'}
                    </p>
                  </div>
                  {imageUrl && (
                    <img
                      src={imageUrl}
                      alt="preview"
                      className="w-12 h-12 rounded-lg object-cover border border-white/30 shrink-0"
                    />
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="banner-is-active"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="w-4 h-4 text-[#516B84] rounded border-slate-300"
                />
                <label htmlFor="banner-is-active" className="text-xs font-semibold text-slate-700">
                  Display this banner live on customer menu immediately
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#516B84] hover:bg-[#3E5367] text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
                >
                  {editingBanner ? 'Update Banner' : 'Publish Banner'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
