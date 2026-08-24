import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Star,
  ThumbsUp,
  Sparkles,
  Plus,
  X,
  CheckCircle2,
  Utensils,
  Award,
  ShieldCheck,
  Send,
  LogOut,
  LogIn,
  Trash2,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { CustomerReview, MenuItem, UserProfile } from '../types';
import { reviewService } from '../services/reviewService';
import { authService } from '../services/authService';
import { AuthModal } from './AuthModal';
import { playTapSound } from '../utils/sound';
import confetti from 'canvas-confetti';

interface ReviewsSectionProps {
  tableNumber: number | null;
  menuItems: MenuItem[];
  onOpenAdmin?: () => void;
}

const QUICK_TAGS = [
  'Super Crispy',
  'Authentic Taste',
  'Fast Table Delivery',
  'Hygiene 10/10',
  'Must Try with Family',
  'Affordable Price',
  'Great Ambience',
  'Pocket Friendly',
];

const RATING_DESCRIPTIONS: Record<number, { text: string; emoji: string }> = {
  5: { text: 'Mindblowing & Delicious!', emoji: '🌟' },
  4: { text: 'Very Good, Loved it!', emoji: '😋' },
  3: { text: 'Good & Satisfying', emoji: '👍' },
  2: { text: 'Average Experience', emoji: '🙂' },
  1: { text: 'Needs Improvement', emoji: '😐' },
};

export const ReviewsSection: React.FC<ReviewsSectionProps> = ({
  tableNumber,
  menuItems,
  onOpenAdmin,
}) => {
  const [reviews, setReviews] = useState<CustomerReview[]>(() =>
    reviewService.getReviews()
  );
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() =>
    authService.getCurrentUser()
  );
  const [activeFilter, setActiveFilter] = useState<'all' | '5' | '4' | 'dish'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [likedReviews, setLikedReviews] = useState<Record<string, boolean>>({});
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Review Form State
  const [formName, setFormName] = useState('');
  const [formRating, setFormRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [formDish, setFormDish] = useState('');
  const [formComment, setFormComment] = useState('');
  const [formSelectedTags, setFormSelectedTags] = useState<string[]>([
    'Authentic Taste',
    'Hygiene 10/10',
  ]);
  const [formTable, setFormTable] = useState<number | undefined>(
    tableNumber || undefined
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  useEffect(() => {
    const unsubReviews = reviewService.subscribe((list) => {
      setReviews(list);
    });
    const unsubAuth = authService.subscribe((user) => {
      setCurrentUser(user);
      if (user) {
        setFormName(user.name);
      }
    });
    return () => {
      unsubReviews();
      unsubAuth();
    };
  }, []);

  useEffect(() => {
    if (tableNumber) {
      setFormTable(tableNumber);
    }
  }, [tableNumber]);

  // Statistics calculation
  const totalReviews = reviews.length;
  const avgRating =
    totalReviews > 0
      ? (reviews.reduce((acc, r) => acc + r.rating, 0) / totalReviews).toFixed(1)
      : '5.0';

  const fiveStarCount = reviews.filter((r) => r.rating === 5).length;
  const fourStarCount = reviews.filter((r) => r.rating === 4).length;
  const threeStarCount = reviews.filter((r) => r.rating === 3).length;
  const twoStarCount = reviews.filter((r) => r.rating === 2).length;
  const oneStarCount = reviews.filter((r) => r.rating === 1).length;

  // Filtered Reviews
  const filteredReviews = reviews.filter((r) => {
    if (activeFilter === '5') return r.rating === 5;
    if (activeFilter === '4') return r.rating === 4;
    if (activeFilter === 'dish') return Boolean(r.dishName);
    return true;
  });

  const handleLikeReview = (reviewId: string) => {
    if (likedReviews[reviewId]) return;
    playTapSound();
    reviewService.likeReview(reviewId);
    setLikedReviews((prev) => ({ ...prev, [reviewId]: true }));
  };

  const handleDeleteReview = async (reviewId: string) => {
    if (!currentUser?.isAdmin) return;
    if (window.confirm('Kya aap is review ko delete karna chahte hain?')) {
      playTapSound();
      await reviewService.deleteReview(reviewId);
    }
  };

  const handleToggleTag = (tag: string) => {
    playTapSound();
    setFormSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  // Direct Google Sign-In button click handler
  const handleDirectGoogleSignIn = async () => {
    setAuthError(null);
    setIsGoogleLoading(true);
    playTapSound();

    try {
      const user = await authService.signInWithGoogle();
      setIsGoogleLoading(false);
      setFormName(user.name);
    } catch (err: any) {
      setIsGoogleLoading(false);
      console.warn('Google Sign-In note:', err);
      // Fallback: Open the modal so user can retry or use alternative login
      setIsAuthModalOpen(true);
      setAuthError(err.message || 'Google popup sign-in asafal raha.');
    }
  };

  // Trigger review modal with Auth Guard
  const handleOpenReviewModal = () => {
    playTapSound();
    if (!currentUser) {
      // Require Google / Email authentication first
      setIsAuthModalOpen(true);
    } else {
      setFormName(currentUser.name);
      setIsModalOpen(true);
    }
  };

  const handleAuthSuccess = (user: UserProfile) => {
    setIsAuthModalOpen(false);
    setFormName(user.name);
    // Proceed to open review modal
    setTimeout(() => {
      setIsModalOpen(true);
    }, 150);
  };

  const handleLogout = async () => {
    playTapSound();
    await authService.logout();
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      setIsAuthModalOpen(true);
      return;
    }
    if (!formName.trim() || !formComment.trim()) return;

    setIsSubmitting(true);
    playTapSound();

    try {
      await reviewService.addReview(
        {
          rating: formRating,
          comment: formComment.trim(),
          dishName: formDish ? formDish : undefined,
          tags: formSelectedTags,
          tableNumber: formTable,
        },
        {
          ...currentUser,
          name: formName.trim() || currentUser.name,
        }
      );

      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.7 },
          colors: ['#516B84', '#10B981', '#F59E0B'],
        });
      } catch {
        // Confetti fallback
      }

      setIsSubmitting(false);
      setIsModalOpen(false);
      setFormComment('');
      setFormDish('');
      setShowSuccessToast(true);
      setTimeout(() => setShowSuccessToast(false), 4000);
    } catch {
      setIsSubmitting(false);
    }
  };

  const formatRelativeTime = (isoString: string) => {
    try {
      const diffMs = Date.now() - new Date(isoString).getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffMins < 2) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays === 1) return 'Yesterday';
      if (diffDays < 7) return `${diffDays}d ago`;
      return new Date(isoString).toLocaleDateString('en-IN', {
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return 'Recently';
    }
  };

  const getAvatarColor = (name: string) => {
    const colors = [
      'bg-[#516B84] text-white',
      'bg-emerald-600 text-white',
      'bg-amber-600 text-white',
      'bg-rose-600 text-white',
      'bg-indigo-600 text-white',
      'bg-teal-600 text-white',
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  return (
    <section
      id="customer-reviews-section"
      className="max-w-5xl mx-auto px-2.5 sm:px-4 py-5 sm:py-8 border-t border-[#d8d6d3] mt-4 sm:mt-6"
    >
      {/* Toast Notification */}
      <AnimatePresence>
        {showSuccessToast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-14 sm:top-16 left-1/2 -translate-x-1/2 z-50 bg-emerald-700 text-white px-3.5 py-2 rounded-xl shadow-lg flex items-center gap-2 text-xs font-semibold"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-300" />
            <span>Thank you! Aapka verified review publish ho gaya hai.</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header with Title & Single Google Sign-In or User Profile Action */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2.5 mb-3 sm:mb-4">
        <div>
          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#516B84]/10 text-[#516B84] text-[10px] font-bold mb-1 uppercase tracking-wide">
            <Sparkles className="w-2.5 h-2.5 text-amber-500" />
            <span>Customer Feedback</span>
          </div>
          <h2 className="text-lg sm:text-2xl font-bold text-[#1E293B] font-['Outfit'] leading-tight">
            Customer Reviews
          </h2>
          <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">
            Real guest experiences from Zoya Chat Center
          </p>
        </div>

        {/* User Auth Status & Action Buttons */}
        <div className="flex items-center flex-wrap gap-1.5 sm:gap-2 shrink-0">
          {currentUser ? (
            <div className="flex items-center gap-1.5 bg-white px-2.5 py-1.5 rounded-xl border border-[#d8d6d3] shadow-2xs">
              {currentUser.photoUrl ? (
                <img
                  src={currentUser.photoUrl}
                  alt={currentUser.name}
                  className="w-6 h-6 rounded-full object-cover border border-slate-200"
                />
              ) : (
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${getAvatarColor(
                    currentUser.name
                  )}`}
                >
                  {currentUser.name.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="flex flex-col text-left">
                <div className="flex items-center gap-1">
                  <span className="text-xs font-bold text-slate-800 line-clamp-1 max-w-[100px] sm:max-w-[140px]">
                    {currentUser.name}
                  </span>
                  {currentUser.isAdmin && (
                    <span className="bg-amber-100 text-amber-900 border border-amber-300 text-[9px] font-extrabold px-1 rounded">
                      ADMIN
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-slate-400 font-mono line-clamp-1 max-w-[120px] sm:max-w-[150px]">
                  {currentUser.email}
                </span>
              </div>

              {/* Sign Out */}
              <button
                type="button"
                onClick={handleLogout}
                title="Sign Out"
                className="ml-1 p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            /* Single Google Sign-In button near Customer Reviews */
            <motion.button
              id="google-signin-reviews-btn"
              type="button"
              disabled={isGoogleLoading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleDirectGoogleSignIn}
              className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 hover:text-slate-900 text-xs sm:text-sm font-bold shadow-2xs transition-all cursor-pointer disabled:opacity-50"
            >
              {isGoogleLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-[#516B84]" />
                  <span>Connecting...</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.15C3.27 21.36 7.35 24 12 24z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.26C.46 8.16 0 9.97 0 12s.46 3.84 1.26 5.42l4.02-3.15z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.35 0 3.27 2.64 1.26 6.58l4.02 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                    />
                  </svg>
                  <span>Sign in with Google</span>
                </>
              )}
            </motion.button>
          )}

          {/* ADMIN PANEL BUTTON - ONLY rendered for the 2 authorized admin emails */}
          {currentUser?.isAdmin && onOpenAdmin && (
            <motion.button
              id="admin-panel-access-btn"
              type="button"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => {
                playTapSound();
                onOpenAdmin();
              }}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs sm:text-sm font-bold shadow-soft transition-all shrink-0 cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4 text-slate-950" />
              <span>Admin Panel</span>
            </motion.button>
          )}

          {/* Add Review Button */}
          <motion.button
            id="write-review-btn"
            type="button"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.96 }}
            onClick={handleOpenReviewModal}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#516B84] hover:bg-[#3E5367] text-white text-xs sm:text-sm font-bold shadow-soft transition-all shrink-0 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Rate / Review</span>
          </motion.button>
        </div>
      </div>

      {/* Auth Error Banner if any */}
      {authError && (
        <div className="mb-3 p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center justify-between gap-2 animate-fadeIn">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{authError}</span>
          </div>
          <button
            type="button"
            onClick={() => setAuthError(null)}
            className="text-rose-500 hover:text-rose-800 p-0.5"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Overall Ratings Summary Card - Mobile Optimized */}
      <div className="bg-white rounded-xl sm:rounded-2xl border border-[#d8d6d3] p-3 sm:p-4 shadow-soft mb-3.5 sm:mb-5">
        <div className="flex flex-row items-center justify-between gap-3">
          {/* Big Score + Stars */}
          <div className="flex items-center gap-3">
            <div className="flex items-baseline gap-1">
              <span className="text-2xl sm:text-3xl font-extrabold text-[#516B84] font-['Outfit']">{avgRating}</span>
              <span className="text-xs font-medium text-slate-400">/5</span>
            </div>
            <div>
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`w-3.5 h-3.5 ${
                      star <= Math.round(Number(avgRating))
                        ? 'text-amber-400 fill-amber-400'
                        : 'text-slate-200'
                    }`}
                  />
                ))}
              </div>
              <span className="text-[10px] sm:text-xs font-semibold text-slate-500 block mt-0.5">
                {totalReviews} Verified Ratings
              </span>
            </div>
          </div>

          {/* Compact Trust Badges */}
          <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs">
            <span className="hidden xs:inline-flex items-center gap-1 px-2 py-1 rounded-md bg-emerald-50 text-emerald-800 font-semibold border border-emerald-200">
              <ShieldCheck className="w-3 h-3 text-emerald-600" />
              <span>100% Fresh</span>
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-blue-50 text-[#516B84] font-semibold border border-blue-200">
              <Award className="w-3 h-3 text-[#516B84]" />
              <span>98% Happy</span>
            </span>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 mb-3 scrollbar-none text-[11px]">
        <button
          type="button"
          onClick={() => {
            playTapSound();
            setActiveFilter('all');
          }}
          className={`px-2.5 py-1 rounded-md font-semibold transition-all whitespace-nowrap ${
            activeFilter === 'all'
              ? 'bg-[#516B84] text-white shadow-2xs'
              : 'bg-white text-slate-600 border border-[#d8d6d3] hover:bg-slate-50'
          }`}
        >
          All ({totalReviews})
        </button>

        <button
          type="button"
          onClick={() => {
            playTapSound();
            setActiveFilter('5');
          }}
          className={`px-2.5 py-1 rounded-md font-semibold flex items-center gap-1 transition-all whitespace-nowrap ${
            activeFilter === '5'
              ? 'bg-[#516B84] text-white shadow-2xs'
              : 'bg-white text-slate-600 border border-[#d8d6d3] hover:bg-slate-50'
          }`}
        >
          <Star className="w-2.5 h-2.5 text-amber-400 fill-amber-400" />
          <span>5★ ({fiveStarCount})</span>
        </button>

        <button
          type="button"
          onClick={() => {
            playTapSound();
            setActiveFilter('4');
          }}
          className={`px-2.5 py-1 rounded-md font-semibold flex items-center gap-1 transition-all whitespace-nowrap ${
            activeFilter === '4'
              ? 'bg-[#516B84] text-white shadow-2xs'
              : 'bg-white text-slate-600 border border-[#d8d6d3] hover:bg-slate-50'
          }`}
        >
          <Star className="w-2.5 h-2.5 text-amber-400 fill-amber-400" />
          <span>4★ ({fourStarCount})</span>
        </button>

        <button
          type="button"
          onClick={() => {
            playTapSound();
            setActiveFilter('dish');
          }}
          className={`px-2.5 py-1 rounded-md font-semibold flex items-center gap-1 transition-all whitespace-nowrap ${
            activeFilter === 'dish'
              ? 'bg-[#516B84] text-white shadow-2xs'
              : 'bg-white text-slate-600 border border-[#d8d6d3] hover:bg-slate-50'
          }`}
        >
          <Utensils className="w-2.5 h-2.5 text-[#516B84]" />
          <span>Dishes</span>
        </button>
      </div>

      {/* Reviews Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 sm:gap-3.5">
        {filteredReviews.map((rev, index) => {
          const isLiked = likedReviews[rev.id];
          const totalLikes = (rev.likesCount || 0) + (isLiked ? 1 : 0);

          return (
            <motion.div
              key={rev.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: Math.min(index * 0.04, 0.2) }}
              className="bg-white rounded-xl border border-[#d8d6d3] p-3 shadow-2xs flex flex-col justify-between hover:border-slate-300 transition-all"
            >
              <div>
                {/* Top User Info & Rating */}
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-2">
                    {rev.userPhotoUrl ? (
                      <img
                        src={rev.userPhotoUrl}
                        alt={rev.name}
                        className="w-7 h-7 rounded-full object-cover border border-slate-200"
                      />
                    ) : (
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-[10px] ${getAvatarColor(
                          rev.name
                        )}`}
                      >
                        {rev.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-1">
                        <span className="font-bold text-xs text-[#1E293B] font-['Outfit'] line-clamp-1">
                          {rev.name}
                        </span>
                        {rev.authProvider === 'google' && (
                          <span
                            title="Google Verified"
                            className="inline-flex items-center gap-0.5 text-[8px] font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-1 py-0.2 rounded"
                          >
                            Google
                          </span>
                        )}
                        {rev.isVerified && rev.authProvider !== 'google' && (
                          <span className="inline-flex items-center gap-0.5 text-[8px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1 py-0.2 rounded">
                            ✓ {rev.tableNumber ? `T${rev.tableNumber}` : 'Verified'}
                          </span>
                        )}
                      </div>
                      <span className="text-[9px] text-slate-400 block leading-tight">
                        {formatRelativeTime(rev.createdAt)}
                      </span>
                    </div>
                  </div>

                  {/* Stars */}
                  <div className="flex items-center gap-0.5 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200/60 shrink-0">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-2.5 h-2.5 ${
                          star <= rev.rating
                            ? 'text-amber-400 fill-amber-400'
                            : 'text-slate-200'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                {/* Favorite Dish Mention Tag */}
                {rev.dishName && (
                  <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#516B84]/10 text-[#516B84] text-[9px] font-semibold mb-1">
                    <Utensils className="w-2 h-2" />
                    <span>Favorite: {rev.dishName}</span>
                  </div>
                )}

                {/* Review Text */}
                <p className="text-xs text-slate-700 leading-relaxed font-normal mb-1.5">
                  "{rev.comment}"
                </p>

                {/* Quick Tags */}
                {rev.tags && rev.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-1.5">
                    {rev.tags.map((t, idx) => (
                      <span
                        key={idx}
                        className="text-[8px] font-medium bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded-full"
                      >
                        #{t}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Bottom Helpful / Like Action and Admin Actions */}
              <div className="pt-1.5 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
                <div className="flex items-center gap-1.5">
                  <span>Dine-in</span>
                  {currentUser?.isAdmin && (
                    <button
                      type="button"
                      onClick={() => handleDeleteReview(rev.id)}
                      className="inline-flex items-center gap-0.5 text-[9px] text-rose-600 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 px-1.5 py-0.5 rounded font-semibold transition-colors cursor-pointer"
                      title="Delete Review (Admin Only)"
                    >
                      <Trash2 className="w-2.5 h-2.5" />
                      <span>Delete</span>
                    </button>
                  )}
                </div>

                <motion.button
                  type="button"
                  whileTap={{ scale: 0.9 }}
                  onClick={() => handleLikeReview(rev.id)}
                  className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold transition-all ${
                    isLiked
                      ? 'bg-rose-50 text-rose-600 border border-rose-200'
                      : 'hover:bg-slate-100 text-slate-500'
                  }`}
                  aria-label="Helpful review"
                >
                  <ThumbsUp
                    className={`w-3 h-3 ${
                      isLiked ? 'text-rose-600 fill-rose-600' : 'text-slate-400'
                    }`}
                  />
                  <span>Helpful ({totalLikes})</span>
                </motion.button>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Auth Modal Triggered on Review Intent */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={handleAuthSuccess}
        title="Sign In to Write a Review"
        subtitle="Authenticate via Google or Email to share verified feedback"
      />

      {/* Review Submission Modal Dialog */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-[#d8d6d3] overflow-hidden max-h-[90vh] flex flex-col"
            >
              {/* Modal Header */}
              <div className="px-4 sm:px-5 py-3.5 bg-slate-50 border-b border-[#d8d6d3] flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-[#1E293B] font-['Outfit']">
                    Apna Review Likhein
                  </h3>
                  <p className="text-xs text-slate-500">
                    Share your genuine taste & dining experience
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    playTapSound();
                    setIsModalOpen(false);
                  }}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body / Form */}
              <form
                onSubmit={handleSubmitReview}
                className="p-4 sm:p-5 overflow-y-auto space-y-4"
              >
                {/* Authenticated User Banner inside Review Form */}
                {currentUser && (
                  <div className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                    <div className="flex items-center gap-2">
                      {currentUser.photoUrl ? (
                        <img
                          src={currentUser.photoUrl}
                          alt={currentUser.name}
                          className="w-7 h-7 rounded-full object-cover"
                        />
                      ) : (
                        <div
                          className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ${getAvatarColor(
                            currentUser.name
                          )}`}
                        >
                          {currentUser.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <span className="text-xs font-bold text-slate-800 block leading-tight">
                          Posting as: {currentUser.name}
                        </span>
                        <span className="text-[10px] text-emerald-600 font-semibold block leading-tight">
                          ✓ Verified {currentUser.provider === 'google' ? 'Google' : 'Email'} Account
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setIsModalOpen(false);
                        setIsAuthModalOpen(true);
                      }}
                      className="text-[11px] font-semibold text-[#516B84] hover:underline"
                    >
                      Switch Account
                    </button>
                  </div>
                )}

                {/* 1. Rating Selector */}
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-center">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    How was your experience?
                  </label>

                  <div className="flex items-center justify-center gap-2 my-1">
                    {[1, 2, 3, 4, 5].map((star) => {
                      const isFilled = (hoverRating || formRating) >= star;
                      return (
                        <button
                          key={star}
                          type="button"
                          onMouseEnter={() => setHoverRating(star)}
                          onMouseLeave={() => setHoverRating(0)}
                          onClick={() => {
                            playTapSound();
                            setFormRating(star);
                          }}
                          className="p-1 hover:scale-125 transition-transform cursor-pointer"
                        >
                          <Star
                            className={`w-7 h-7 ${
                              isFilled
                                ? 'text-amber-400 fill-amber-400 drop-shadow-xs'
                                : 'text-slate-300'
                            }`}
                          />
                        </button>
                      );
                    })}
                  </div>

                  <div className="text-xs font-semibold text-[#516B84] flex items-center justify-center gap-1 mt-1">
                    <span>
                      {RATING_DESCRIPTIONS[hoverRating || formRating]?.emoji}
                    </span>
                    <span>
                      {RATING_DESCRIPTIONS[hoverRating || formRating]?.text}
                    </span>
                  </div>
                </div>

                {/* 2. Customer Name & Table */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Aapka Naam <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Asma Shaikh"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-[#d8d6d3] rounded-xl focus:outline-none focus:border-[#516B84] focus:ring-1 focus:ring-[#516B84]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Table Number
                    </label>
                    <select
                      value={formTable || ''}
                      onChange={(e) =>
                        setFormTable(
                          e.target.value ? Number(e.target.value) : undefined
                        )
                      }
                      className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-[#d8d6d3] rounded-xl focus:outline-none focus:border-[#516B84] focus:ring-1 focus:ring-[#516B84]"
                    >
                      <option value="">Select Table (Optional)</option>
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((t) => (
                        <option key={t} value={t}>
                          Table {t}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* 3. Favorite Dish from Menu */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Favorite Dish / Kya Order Kiya Tha?
                  </label>
                  <select
                    value={formDish}
                    onChange={(e) => setFormDish(e.target.value)}
                    className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-[#d8d6d3] rounded-xl focus:outline-none focus:border-[#516B84] focus:ring-1 focus:ring-[#516B84]"
                  >
                    <option value="">Select a dish from menu (Optional)</option>
                    {menuItems.map((item) => (
                      <option key={item.id} value={item.name}>
                        {item.name} (₹{item.price})
                      </option>
                    ))}
                  </select>
                </div>

                {/* 4. Experience Tags (Click to toggle) */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    What stood out? (Tags)
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {QUICK_TAGS.map((tag) => {
                      const isSelected = formSelectedTags.includes(tag);
                      return (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => handleToggleTag(tag)}
                          className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-[#516B84] text-white shadow-2xs'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          {isSelected ? '✓ ' : '+ '}
                          {tag}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 5. Review Comment */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Review Description <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    required
                    rows={3}
                    placeholder="Taste, freshness, quantity, staff service ke baare mein likhein..."
                    value={formComment}
                    onChange={(e) => setFormComment(e.target.value)}
                    className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-[#d8d6d3] rounded-xl focus:outline-none focus:border-[#516B84] focus:ring-1 focus:ring-[#516B84] resize-none"
                  />
                </div>

                {/* Submit Action */}
                <div className="pt-2">
                  <motion.button
                    type="submit"
                    disabled={
                      isSubmitting || !formName.trim() || !formComment.trim()
                    }
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full py-2.5 px-4 rounded-xl bg-[#516B84] hover:bg-[#3E5367] disabled:opacity-50 text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-soft transition-all cursor-pointer"
                  >
                    {isSubmitting ? (
                      <span>Publishing verified review...</span>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>Submit Review</span>
                      </>
                    )}
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
};
