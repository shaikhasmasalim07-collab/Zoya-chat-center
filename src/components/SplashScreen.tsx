import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ChefHat, Sparkles, UtensilsCrossed, ArrowRight } from 'lucide-react';
import { RESTAURANT_DETAILS } from '../data/restaurantInfo';

interface SplashScreenProps {
  onFinish: () => void;
  durationMs?: number; // default 2500ms
}

export const SplashScreen: React.FC<SplashScreenProps> = ({
  onFinish,
  durationMs = 2500,
}) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const currentPct = Math.min(100, Math.floor((elapsed / durationMs) * 100));
      setProgress(currentPct);

      if (elapsed >= durationMs) {
        clearInterval(interval);
        onFinish();
      }
    }, 25);

    return () => clearInterval(interval);
  }, [durationMs, onFinish]);

  return (
    <motion.div
      id="app-splash-screen"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.02 }}
      transition={{ duration: 0.45, ease: 'easeInOut' }}
      className="fixed inset-0 z-[9999] bg-[#EAE8E6] flex flex-col items-center justify-between p-6 select-none overflow-hidden"
    >
      {/* Background Decorative Ambient Circles */}
      <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-[#516B84]/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-80 h-80 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />

      {/* Top Bar: Skip button */}
      <div className="w-full max-w-sm flex justify-end pt-2">
        <motion.button
          type="button"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          onClick={onFinish}
          className="text-xs font-semibold text-slate-500 hover:text-[#516B84] bg-white/70 backdrop-blur-xs px-3 py-1.5 rounded-full border border-[#d8d6d3] flex items-center gap-1 shadow-2xs active:scale-95 transition-all cursor-pointer"
        >
          <span>Skip</span>
          <ArrowRight className="w-3 h-3" />
        </motion.button>
      </div>

      {/* Center Branding Content */}
      <div className="flex flex-col items-center text-center max-w-sm px-4">
        {/* Animated Brand Emblem */}
        <motion.div
          initial={{ scale: 0.6, opacity: 0, rotate: -15 }}
          animate={{ scale: 1, opacity: 1, rotate: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="relative mb-5"
        >
          {/* Pulsing ring */}
          <motion.div
            animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.7, 0.3] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute inset-0 rounded-3xl bg-[#516B84]/20 blur-md"
          />

          <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-gradient-to-br from-[#516B84] to-[#36495c] flex items-center justify-center text-white shadow-xl shadow-[#516B84]/25 border-2 border-white/60">
            <ChefHat className="w-12 h-12 sm:w-14 sm:h-14 text-amber-300 stroke-[2.2]" />

            {/* Sparkle Icons */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
              className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-amber-400 text-amber-950 flex items-center justify-center shadow-md border-2 border-white"
            >
              <Sparkles className="w-3.5 h-3.5 fill-amber-950" />
            </motion.div>
          </div>
        </motion.div>

        {/* Title */}
        <motion.div
          initial={{ y: 15, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/80 border border-[#d8d6d3] text-[#516B84] text-[11px] font-bold tracking-widest uppercase mb-2 shadow-2xs">
            <UtensilsCrossed className="w-3 h-3 text-amber-600" />
            <span>Digital Dining · Aurangabad</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1E293B] font-['Outfit'] tracking-tight mb-1">
            {RESTAURANT_DETAILS.name}
          </h1>

          <p className="text-xs sm:text-sm text-slate-600 font-medium">
            {RESTAURANT_DETAILS.tagline}
          </p>
        </motion.div>
      </div>

      {/* Bottom Progress & Status Bar */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className="w-full max-w-xs flex flex-col items-center gap-2 pb-4"
      >
        <div className="w-full flex items-center justify-between text-[11px] font-semibold text-slate-500">
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
            Fresh Digital Menu
          </span>
          <span>{progress}%</span>
        </div>

        {/* Progress Bar Container */}
        <div className="w-full h-2 bg-white/80 rounded-full overflow-hidden p-0.5 border border-[#d8d6d3] shadow-inner">
          <motion.div
            className="h-full bg-gradient-to-r from-[#516B84] to-emerald-600 rounded-full"
            style={{ width: `${progress}%` }}
            transition={{ ease: 'linear' }}
          />
        </div>

        <p className="text-[10px] text-slate-400 text-center font-normal pt-1">
          Instant QR Table Ordering · Hot & Crispy Delicacies
        </p>
      </motion.div>
    </motion.div>
  );
};
