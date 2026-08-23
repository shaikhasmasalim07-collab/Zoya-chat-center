import React from 'react';
import { ChefHat, ShieldCheck, Instagram, Phone, MessageCircle, MapPin, ExternalLink, Clock } from 'lucide-react';
import { RESTAURANT_DETAILS } from '../data/restaurantInfo';
import { playTapSound } from '../utils/sound';

interface FooterProps {
  onOpenAdmin?: () => void;
  isAdminActiveOnOtherDevice?: boolean;
}

export const Footer: React.FC<FooterProps> = ({ onOpenAdmin, isAdminActiveOnOtherDevice }) => {
  return (
    <footer
      id="main-app-footer"
      className="mt-auto pt-6 pb-12 px-3 sm:px-4 border-t border-[#d4d2cf] text-center bg-[#E6E5E4]"
    >
      <div className="max-w-xl mx-auto flex flex-col items-center gap-4">
        {/* Brand info */}
        <div className="flex flex-col items-center gap-1">
          <div className="inline-flex items-center gap-2 text-base font-bold text-[#516B84] font-['Outfit']">
            <div className="w-6 h-6 rounded-lg bg-[#516B84] text-white flex items-center justify-center shadow-xs">
              <ChefHat className="w-3.5 h-3.5" />
            </div>
            <span>{RESTAURANT_DETAILS.name}</span>
          </div>
          <p className="text-xs text-slate-600 font-medium">
            {RESTAURANT_DETAILS.tagline}
          </p>
        </div>

        {/* Instant Action Contact & Social Buttons - Opens immediately on click */}
        <div
          id="footer-contact-actions-grid"
          className="grid grid-cols-2 sm:grid-cols-4 gap-2 w-full max-w-lg"
        >
          {/* 1. Instagram Button */}
          <a
            id="footer-instagram-btn"
            href={RESTAURANT_DETAILS.instagramUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => playTapSound()}
            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-[#d8d6d3] text-pink-700 hover:border-pink-500 hover:bg-pink-50/60 transition-all text-xs font-semibold shadow-xs active:scale-95 group"
          >
            <Instagram className="w-4 h-4 text-pink-600 group-hover:scale-110 transition-transform" />
            <span className="font-['Outfit']">@{RESTAURANT_DETAILS.instagram}</span>
          </a>

          {/* 2. Direct Phone Call Button */}
          <a
            id="footer-phone-call-btn"
            href={`tel:${RESTAURANT_DETAILS.phone}`}
            onClick={() => playTapSound()}
            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-[#d8d6d3] text-[#516B84] hover:border-[#516B84] hover:bg-[#516B84]/5 transition-all text-xs font-semibold shadow-xs active:scale-95 group"
          >
            <Phone className="w-4 h-4 text-[#516B84] group-hover:scale-110 transition-transform" />
            <span>Call Now</span>
          </a>

          {/* 3. WhatsApp Direct Chat Button */}
          <a
            id="footer-whatsapp-btn"
            href={`https://wa.me/91${RESTAURANT_DETAILS.whatsapp}?text=Hello%20Zoya%20Chat%20Center%20Aurangabad`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => playTapSound()}
            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-[#d8d6d3] text-emerald-700 hover:border-emerald-500 hover:bg-emerald-50/60 transition-all text-xs font-semibold shadow-xs active:scale-95 group"
          >
            <MessageCircle className="w-4 h-4 text-emerald-600 group-hover:scale-110 transition-transform" />
            <span>WhatsApp</span>
          </a>

          {/* 4. Google Maps Directions Button */}
          <a
            id="footer-maps-location-btn"
            href={RESTAURANT_DETAILS.mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => playTapSound()}
            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-[#d8d6d3] text-slate-800 hover:border-amber-500 hover:bg-amber-50/60 transition-all text-xs font-semibold shadow-xs active:scale-95 group"
          >
            <MapPin className="w-4 h-4 text-amber-600 group-hover:scale-110 transition-transform" />
            <span>Map Directions</span>
          </a>
        </div>

        {/* Address & Timings Display */}
        <div className="bg-white/80 backdrop-blur-xs p-3 rounded-xl border border-[#d8d6d3] w-full max-w-lg text-left text-xs space-y-1.5">
          <div className="flex items-start gap-2 text-slate-700">
            <MapPin className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-[#1E293B] block">Zoya Chat Center Location:</span>
              <a
                href={RESTAURANT_DETAILS.mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-600 hover:text-[#516B84] hover:underline flex items-center gap-1"
              >
                <span>{RESTAURANT_DETAILS.address}</span>
                <ExternalLink className="w-3 h-3 inline text-slate-400" />
              </a>
            </div>
          </div>

          <div className="flex items-center gap-2 text-slate-600 pt-1 border-t border-slate-100 text-[11px]">
            <Clock className="w-3.5 h-3.5 text-[#516B84]" />
            <span>Open Everyday: {RESTAURANT_DETAILS.timing}</span>
          </div>
        </div>

        {/* Subtle discreet owner access through copyright footer - No 'Admin Panel' text displayed */}
        <div className="pt-2 text-[11px] text-slate-500 flex items-center justify-center gap-1 select-none">
          {onOpenAdmin ? (
            <button
              id="footer-owner-entry-btn"
              type="button"
              onClick={() => {
                playTapSound();
                onOpenAdmin();
              }}
              className="text-slate-500 hover:text-[#516B84] transition-colors py-1 px-2 rounded-md hover:bg-slate-200/50"
            >
              © {new Date().getFullYear()} {RESTAURANT_DETAILS.name} · Aurangabad
            </button>
          ) : (
            <span>© {new Date().getFullYear()} {RESTAURANT_DETAILS.name} · Aurangabad</span>
          )}
        </div>
      </div>
    </footer>
  );
};
