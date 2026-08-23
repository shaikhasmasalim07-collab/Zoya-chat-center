import React, { useState, useEffect } from 'react';
import { Coupon } from '../types';
import { couponService } from '../services/couponService';
import {
  Tag,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  XCircle,
  Percent,
  IndianRupee,
  Sparkles,
  Search,
  Check,
  X,
  AlertCircle,
} from 'lucide-react';
import { playTapSound } from '../utils/sound';

export const CouponManager: React.FC = () => {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Form State
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [discountType, setDiscountType] = useState<'percentage' | 'flat'>('percentage');
  const [discountValue, setDiscountValue] = useState<number>(20);
  const [minOrderAmount, setMinOrderAmount] = useState<number>(199);
  const [maxDiscount, setMaxDiscount] = useState<number | undefined>(100);
  const [isActive, setIsActive] = useState(true);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    const unsub = couponService.subscribe((list) => {
      setCoupons(list);
    });
    return () => unsub();
  }, []);

  const handleOpenAdd = () => {
    setEditingCoupon(null);
    setCode('');
    setDescription('');
    setDiscountType('percentage');
    setDiscountValue(20);
    setMinOrderAmount(199);
    setMaxDiscount(100);
    setIsActive(true);
    setFormError('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (c: Coupon) => {
    setEditingCoupon(c);
    setCode(c.code);
    setDescription(c.description);
    setDiscountType(c.discountType);
    setDiscountValue(c.discountValue);
    setMinOrderAmount(c.minOrderAmount);
    setMaxDiscount(c.maxDiscount);
    setIsActive(c.isActive);
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) {
      setFormError('Coupon code is required.');
      return;
    }
    if (discountValue <= 0) {
      setFormError('Discount value must be greater than 0.');
      return;
    }

    playTapSound();

    if (editingCoupon) {
      await couponService.updateCoupon({
        id: editingCoupon.id,
        code: code.trim().toUpperCase(),
        description: description.trim() || `${discountType === 'percentage' ? `${discountValue}% OFF` : `₹${discountValue} OFF`} on min order ₹${minOrderAmount}`,
        discountType,
        discountValue,
        minOrderAmount,
        maxDiscount: discountType === 'percentage' ? maxDiscount : undefined,
        isActive,
      });
    } else {
      await couponService.addCoupon({
        code: code.trim().toUpperCase(),
        description: description.trim() || `${discountType === 'percentage' ? `${discountValue}% OFF` : `₹${discountValue} OFF`} on min order ₹${minOrderAmount}`,
        discountType,
        discountValue,
        minOrderAmount,
        maxDiscount: discountType === 'percentage' ? maxDiscount : undefined,
        isActive,
      });
    }

    setIsModalOpen(false);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this coupon?')) {
      playTapSound();
      await couponService.deleteCoupon(id);
    }
  };

  const handleToggleActive = async (id: string) => {
    playTapSound();
    await couponService.toggleActive(id);
  };

  const filteredCoupons = coupons.filter(
    (c) =>
      c.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-3.5 sm:p-4 rounded-xl border border-[#d8d6d3] shadow-soft">
        <div>
          <h3 className="text-sm sm:text-base font-bold text-[#516B84] font-['Outfit'] flex items-center gap-2">
            <Tag className="w-4 h-4 text-[#516B84]" />
            <span>Coupon & Promo Codes Manager</span>
            <span className="text-xs font-semibold bg-[#EBF0F5] text-[#516B84] px-2 py-0.5 rounded-full">
              {coupons.length} total
            </span>
          </h3>
          <p className="text-xs text-slate-500">
            Create discount vouchers that customers can apply at checkout.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {/* Search Box */}
          <div className="relative flex-1 sm:w-48">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search coupon..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full text-xs pl-8 pr-3 py-1.5 bg-[#F7F7F6] border border-[#d8d6d3] rounded-lg focus:outline-none focus:border-[#516B84]"
            />
          </div>

          <button
            type="button"
            onClick={handleOpenAdd}
            className="px-3 py-1.5 bg-[#516B84] hover:bg-[#3E5367] text-white text-xs font-semibold rounded-lg shadow-xs flex items-center gap-1.5 shrink-0 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Coupon</span>
          </button>
        </div>
      </div>

      {/* Coupons List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {filteredCoupons.map((coupon) => (
          <div
            key={coupon.id}
            className={`bg-white rounded-xl border p-3.5 shadow-soft transition-all flex flex-col justify-between ${
              coupon.isActive ? 'border-[#d8d6d3]' : 'border-slate-200 opacity-60 bg-slate-50'
            }`}
          >
            <div>
              {/* Header Badge */}
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-1.5">
                  <span className="font-mono text-sm font-bold tracking-wider px-2.5 py-1 bg-amber-50 text-amber-900 border border-dashed border-amber-300 rounded-md">
                    {coupon.code}
                  </span>
                  <span
                    className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${
                      coupon.discountType === 'percentage'
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    }`}
                  >
                    {coupon.discountType === 'percentage'
                      ? `${coupon.discountValue}% OFF`
                      : `₹${coupon.discountValue} FLAT`}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => handleToggleActive(coupon.id)}
                  className={`text-[11px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 transition-colors ${
                    coupon.isActive
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-slate-200 text-slate-600'
                  }`}
                  title="Toggle status"
                >
                  {coupon.isActive ? (
                    <>
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      Active
                    </>
                  ) : (
                    <>
                      <XCircle className="w-3 h-3 text-slate-500" />
                      Disabled
                    </>
                  )}
                </button>
              </div>

              {/* Description & Min Order info */}
              <p className="text-xs text-slate-700 font-medium mb-2">
                {coupon.description}
              </p>

              <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500 bg-[#F7F7F6] p-2 rounded-lg border border-[#E6E5E4]">
                <span>Min Order: <strong className="text-slate-700">₹{coupon.minOrderAmount}</strong></span>
                {coupon.maxDiscount && (
                  <span>· Max Cap: <strong className="text-slate-700">₹{coupon.maxDiscount}</strong></span>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-3 mt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => handleOpenEdit(coupon)}
                className="px-2.5 py-1 text-xs text-[#516B84] hover:bg-[#EBF0F5] rounded-lg transition-colors flex items-center gap-1 font-medium"
              >
                <Edit2 className="w-3 h-3" />
                Edit
              </button>
              <button
                type="button"
                onClick={() => handleDelete(coupon.id)}
                className="px-2.5 py-1 text-xs text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-1 font-medium"
              >
                <Trash2 className="w-3 h-3" />
                Delete
              </button>
            </div>
          </div>
        ))}

        {filteredCoupons.length === 0 && (
          <div className="col-span-full py-8 text-center bg-white rounded-xl border border-[#d8d6d3] p-4 text-xs text-slate-500">
            No coupon codes found. Click <strong>New Coupon</strong> to add promo codes like ZOYA20 or FLAT50!
          </div>
        )}
      </div>

      {/* Add / Edit Coupon Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="w-full max-w-md bg-white rounded-2xl shadow-soft-lg overflow-hidden border border-[#d8d6d3] p-5 animate-scaleUp"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#516B84] text-white flex items-center justify-center">
                  <Tag className="w-4 h-4" />
                </div>
                <h4 className="text-base font-bold text-[#516B84] font-['Outfit']">
                  {editingCoupon ? 'Edit Coupon Code' : 'Add New Coupon Code'}
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
                  Coupon Code (e.g. ZOYA20, FLAT50)
                </label>
                <input
                  type="text"
                  required
                  placeholder="ZOYA20"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  className="w-full text-xs font-mono font-bold uppercase p-2.5 bg-[#F7F7F6] border border-[#d8d6d3] rounded-lg focus:outline-none focus:border-[#516B84]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Discount Type
                  </label>
                  <select
                    value={discountType}
                    onChange={(e) => setDiscountType(e.target.value as 'percentage' | 'flat')}
                    className="w-full text-xs p-2.5 bg-[#F7F7F6] border border-[#d8d6d3] rounded-lg focus:outline-none focus:border-[#516B84]"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="flat">Flat Discount (₹)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {discountType === 'percentage' ? 'Discount % (e.g. 20)' : 'Flat Amount ₹ (e.g. 50)'}
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={discountValue}
                    onChange={(e) => setDiscountValue(Number(e.target.value))}
                    className="w-full text-xs p-2.5 bg-[#F7F7F6] border border-[#d8d6d3] rounded-lg focus:outline-none focus:border-[#516B84]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Min Order Amount (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={minOrderAmount}
                    onChange={(e) => setMinOrderAmount(Number(e.target.value))}
                    className="w-full text-xs p-2.5 bg-[#F7F7F6] border border-[#d8d6d3] rounded-lg focus:outline-none focus:border-[#516B84]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Max Discount Cap (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="Optional (e.g. 100)"
                    value={maxDiscount || ''}
                    onChange={(e) => setMaxDiscount(e.target.value ? Number(e.target.value) : undefined)}
                    disabled={discountType === 'flat'}
                    className="w-full text-xs p-2.5 bg-[#F7F7F6] border border-[#d8d6d3] rounded-lg focus:outline-none focus:border-[#516B84] disabled:opacity-50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Description / Subtitle
                </label>
                <input
                  type="text"
                  placeholder="e.g. 20% OFF on all Chaats and Burgers!"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full text-xs p-2.5 bg-[#F7F7F6] border border-[#d8d6d3] rounded-lg focus:outline-none focus:border-[#516B84]"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="coupon-is-active"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="w-4 h-4 text-[#516B84] rounded border-slate-300"
                />
                <label htmlFor="coupon-is-active" className="text-xs font-semibold text-slate-700">
                  Enable coupon for customers immediately
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
                  {editingCoupon ? 'Update Coupon' : 'Create Coupon'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
