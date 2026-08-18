import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { ratesApi, promoApi, mediaApi, bannerApi, settingsApi } from "@/lib/api";

// Utility function to calculate relative luminance
const getLuminance = (hex: string): number => {
  const rgb = hex.replace('#', '').match(/.{2}/g);
  if (!rgb) return 0;
  const [r, g, b] = rgb.map(c => {
    const val = parseInt(c, 16) / 255;
    return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

// Function to determine if a color is light or dark
const isLightColor = (hex: string): boolean => {
  return getLuminance(hex) > 0.5;
};

// Get contrasting rate number color based on background (fallback if text_color not set)
const getRateNumberColor = (backgroundColor: string, textColor?: string): string => {
  return textColor || (isLightColor(backgroundColor) ? "#1a365d" : "#ffffff");
};

// Get contrasting label color based on background
const getRateLabelColor = (backgroundColor: string, textColor?: string): string => {
  return textColor || (isLightColor(backgroundColor) ? "#2c5282" : "#e2e8f0");
};

// Get contrasting box background color based on background
const getRateBoxBg = (backgroundColor: string): string => {
  return "transparent";
};

// AutoFit text component to ensure rate values fit in their box auto without overflowing or wrapping
function AutoFitRate({ value, color }: { value: string | number; color?: string }) {
  const text = `₹${value ?? 0}`;
  const charLen = text.length;
  const viewBoxWidth = Math.max(120, charLen * 18);

  return (
    <div className="w-full h-full min-h-0 flex items-center justify-center p-0.5 overflow-hidden">
      <svg
        className="w-full h-full max-h-12 sm:max-h-14 lg:max-h-16"
        viewBox={`0 0 ${viewBoxWidth} 40`}
        preserveAspectRatio="xMidYMid meet"
      >
        <text
          x="50%"
          y="50%"
          dominantBaseline="central"
          textAnchor="middle"
          fill={color || "#000"}
          stroke={color || "#000"}
          strokeWidth="0.8"
          strokeLinejoin="round"
          className="font-gill-ultra font-black"
          fontFamily="'League Spartan', 'Gill Sans Ultra Bold', 'Arial Black', sans-serif"
          fontWeight="900"
          fontSize="28"
        >
          {text}
        </text>
      </svg>
    </div>
  );
}

export default function TVDisplay() {
  const [currentPromoIndex, setCurrentPromoIndex] = useState(0);
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const [showingRates, setShowingRates] = useState(true);
  // Create a function to get Indian time
  const getIndianTime = () => {
    const now = new Date();
    // Convert to Indian timezone (Asia/Kolkata)
    const indianTime = new Date(now.toLocaleString("en-US", {timeZone: "Asia/Kolkata"}));
    return indianTime;
  };
  
  const [currentTime, setCurrentTime] = useState(getIndianTime());
  const [screenSize, setScreenSize] = useState<'mobile' | 'tablet' | 'desktop' | 'tv'>('desktop');

  // Enhanced screen size detection for TV, tablet, mobile, and desktop
  useEffect(() => {
    const checkScreenSize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const aspectRatio = width / height;
      
      // Consider it a TV if: width >= 1280 and either aspect ratio > 1.5 OR height < 900
      // This helps identify 42"+ TVs which typically have 16:9 or wider aspect ratios
      if (width < 640) {
        setScreenSize('mobile');
      } else if (width < 1024 || (width < 1280 && aspectRatio < 1.5)) {
        setScreenSize('tablet');
      } else if (width < 1600 || (width < 1920 && height > 900)) {
        setScreenSize('desktop');
      } else {
        setScreenSize('tv');
      }
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Initial sync on mount to get fresh rates
  useEffect(() => {
    fetch("/api/rates/sync?force=true").catch(() => {});
  }, []);

  // Data queries
  const { data: currentRates } = useQuery({
    queryKey: ["/api/rates/current"],
    queryFn: ratesApi.getCurrent,
    refetchInterval: 5000,
    staleTime: 0,
  });

  const { data: settings } = useQuery({
    queryKey: ["/api/settings/display"],
    queryFn: settingsApi.getDisplay,
    refetchInterval: 30000
  });

  const { data: mediaItems = [] } = useQuery({
    queryKey: ["/api/media"],
    queryFn: () => mediaApi.getAll(true),
    refetchInterval: 30000
  });

  const { data: promoImages = [] } = useQuery({
    queryKey: ["/api/promo"],
    queryFn: () => promoApi.getAll(true),
    refetchInterval: 30000
  });

  const { data: bannerSettings } = useQuery({
    queryKey: ["/api/banner"],
    queryFn: bannerApi.getCurrent,
    refetchInterval: 30000
  });

  // Effect for the live clock
  useEffect(() => {
    const timeInterval = setInterval(() => setCurrentTime(getIndianTime()), 1000);
    return () => clearInterval(timeInterval);
  }, []);

  // Effect for rotating between rates and media
  useEffect(() => {
    if (!settings?.show_media || mediaItems.length === 0) return;

    const ratesDisplayTime = (settings?.rates_display_duration_seconds || 15) * 1000;
    const currentMedia = mediaItems[currentMediaIndex];
    const mediaDisplayTime = (currentMedia?.duration_seconds || 30) * 1000;

    const interval = setInterval(() => {
      if (showingRates) {
        setShowingRates(false);
      } else {
        setCurrentMediaIndex((prev) => (prev + 1) % mediaItems.length);
        setShowingRates(true);
      }
    }, showingRates ? ratesDisplayTime : mediaDisplayTime);

    return () => clearInterval(interval);
  }, [showingRates, currentMediaIndex, mediaItems, settings]);

  // Effect for the promotional image slideshow
  useEffect(() => {
    if (promoImages.length <= 1) return;

    const currentPromo = promoImages[currentPromoIndex];
    const duration_seconds = (currentPromo?.duration_seconds || 5) * 1000;

    const interval = setInterval(() => {
      setCurrentPromoIndex((prev) => (prev + 1) % promoImages.length);
    }, duration_seconds);

    return () => clearInterval(interval);
  }, [currentPromoIndex, promoImages]);

  // Reset indices when arrays change
  useEffect(() => {
    if (mediaItems.length > 0 && currentMediaIndex >= mediaItems.length) {
      setCurrentMediaIndex(0);
    }
  }, [mediaItems, currentMediaIndex]);

  useEffect(() => {
    if (promoImages.length > 0 && currentPromoIndex >= promoImages.length) {
      setCurrentPromoIndex(0);
    }
  }, [promoImages, currentPromoIndex]);

  const isVertical = settings?.orientation === "vertical";
  const currentPromo = promoImages[currentPromoIndex];
  
  // Enhanced responsive font sizing - optimized for all screens
  const getRateFontSize = () => {
    if (screenSize === 'mobile') return "text-lg";
    if (screenSize === 'tablet') return "text-2xl";
    if (screenSize === 'tv') return "text-5xl";
    return settings?.rate_number_font_size || "text-3xl";
  };
  
  // Get spacing based on screen size
  const getSpacing = () => {
    if (screenSize === 'mobile') return { container: "p-1", card: "p-2", gap: "gap-2" };
    if (screenSize === 'tablet') return { container: "p-3", card: "p-4", gap: "gap-4" };
    if (screenSize === 'tv') return { container: "p-4", card: "p-6", gap: "gap-6" };
    return { container: "p-3", card: "p-4", gap: "gap-4" };
  };
  const spacing = getSpacing();
  const rateFontSize = getRateFontSize();

  const getAnimationVariants = (effect: string) => {
    const transitions = {
      fade: { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } },
      'slide-left': { initial: { x: '100%' }, animate: { x: 0 }, exit: { x: '-100%' } },
      'slide-right': { initial: { x: '-100%' }, animate: { x: 0 }, exit: { x: '100%' } },
      'zoom-in': { initial: { scale: 0.8, opacity: 0 }, animate: { scale: 1, opacity: 1 }, exit: { scale: 0.8, opacity: 0 } },
      'zoom-out': { initial: { scale: 1.2, opacity: 0 }, animate: { scale: 1, opacity: 1 }, exit: { scale: 1.2, opacity: 0 } },
      'flip-x': { initial: { rotateX: -90, opacity: 0 }, animate: { rotateX: 0, opacity: 1 }, exit: { rotateX: 90, opacity: 0 } },
      'flip-y': { initial: { rotateY: -90, opacity: 0 }, animate: { rotateY: 0, opacity: 1 }, exit: { rotateY: 90, opacity: 0 } },
      'rotate-in': { initial: { rotate: -90, scale: 0.8, opacity: 0 }, animate: { rotate: 0, scale: 1, opacity: 1 }, exit: { rotate: 90, scale: 0.8, opacity: 0 } },
      'rotate-out': { initial: { rotate: 90, scale: 0.8, opacity: 0 }, animate: { rotate: 0, scale: 1, opacity: 1 }, exit: { rotate: -90, scale: 0.8, opacity: 0 } },
      bounce: { initial: { scale: 0.5, opacity: 0 }, animate: { scale: 1, opacity: 1 }, exit: { scale: 0.5, opacity: 0 } },
    };
    return transitions[effect as keyof typeof transitions] || transitions.fade;
  };

  const animationVariants = currentPromo ? getAnimationVariants(currentPromo.transition_effect || 'fade') : getAnimationVariants('fade');
  const transitionProps = {
    duration: 0.8,
    ease: currentPromo?.transition_effect === 'bounce' ? [0.34, 1.56, 0.64, 1] : "easeInOut" as const,
  };

  if (!currentRates) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-gradient-to-br from-jewelry-primary to-jewelry-secondary">
        <div className="text-center text-white">
          <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-2xl font-semibold">Loading Rates...</p>
        </div>
      </div>
    );
  }

  const currentMedia = mediaItems[currentMediaIndex];

  return (
    <div 
      className="w-full h-screen max-h-screen overflow-hidden flex flex-col select-none"
      style={{ 
        backgroundColor: settings?.background_color || "#FFF8E1",
        color: settings?.text_color || "#212529"
      }}
    >
      <AnimatePresence mode="wait">
        {showingRates ? (
          <motion.div
            key="rates"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.02 }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
            className="flex-1 flex flex-col h-full min-h-0 overflow-hidden"
          >
            {/* Common Header - matches Mobile Control page, with date/time on top-right */}
            <div className="relative bg-gradient-to-r from-gold-600 to-gold-700 text-black px-2 py-1.5 sm:px-4 sm:py-2 flex justify-center items-center flex-shrink-0">
              <img 
                src="/logo.png" 
                alt="Devi Jewellers Logo"
                className="h-10 sm:h-12 md:h-16 lg:h-20 w-auto max-h-[7vh] object-contain"
              />
              {/* Date & Time - top-right */}
              <div className="absolute top-1 right-2 sm:top-2 sm:right-4 text-right">
                <p className="font-extrabold text-xs sm:text-sm md:text-base lg:text-lg text-gray-900 leading-tight tracking-wide">
                  {format(currentTime, "EEEE, MMMM d, yyyy")}
                </p>
                <p className="font-black text-sm sm:text-base md:text-xl lg:text-2xl text-blue-900 leading-tight tracking-wider">
                  {format(currentTime, "hh:mm:ss a")}
                </p>
              </div>
            </div>

            {/* Today's Rate Header Bar */}
            <div className="bg-gradient-to-r from-gold-600 to-gold-700 text-black text-center flex-shrink-0 py-1 sm:py-1.5 border-t border-gold-800/20">
              <h2 className="font-gill-ultra text-base sm:text-xl md:text-2xl lg:text-3xl tracking-widest uppercase">TODAY'S RATES</h2>
            </div>

            {/* Rates Display - Main Viewport Grid */}
            <div className="flex-1 min-h-0 container mx-auto px-2 py-1.5 sm:px-3 sm:py-2 flex flex-col overflow-hidden">
              <div className={`grid gap-2 sm:gap-3 ${screenSize === 'mobile' || isVertical ? 'grid-cols-1' : 'grid-cols-2'} h-full min-h-0 flex-1 overflow-hidden`}>
                
                {/* Gold Rates Column */}
                <div className="flex flex-col justify-between h-full min-h-0 gap-1.5 sm:gap-2">
                  <h3 className="font-gill-ultra text-center text-jewelry-primary text-xs sm:text-sm md:text-base flex-shrink-0 uppercase tracking-wider">
                    GOLD RATES (Per 10 GMS)
                  </h3>
                  
                  {/* 24K Gold */}
                  <div className="flex-1 min-h-0 bg-white rounded-2xl shadow-md p-1.5 sm:p-2.5 border-2 border-gold-400 border-l-4 border-l-jewelry-primary flex flex-col justify-around">
                    <div className="flex justify-between items-center mb-1">
                      <h4 className="font-gill-ultra text-sm sm:text-base md:text-lg lg:text-xl tracking-wide" style={{ color: getRateNumberColor(settings?.background_color || "#FFF8E1", settings?.text_color) }}>24K GOLD</h4>
                      <div className="bg-amber-100/90 border border-gold-400 rounded-full flex items-center justify-center w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 flex-shrink-0 shadow-sm p-0.5">
                        <img src="/gold_ring.svg" alt="Gold Ring" className="w-full h-full object-contain" />
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-1 sm:gap-2 min-h-0 flex-1 items-stretch">
                      <div className="rounded-xl border-2 border-gold-600 shadow-md flex flex-col overflow-hidden bg-white">
                        <div className="bg-gradient-to-r from-gold-600 to-gold-700 text-white font-gill-ultra text-[10px] sm:text-xs md:text-sm py-0.5 sm:py-1 px-1 text-center uppercase tracking-wider border-b-2 border-gold-800 shrink-0 shadow-sm">
                          SALE
                        </div>
                        <div className="flex-1 min-h-0 flex justify-center items-center overflow-hidden" style={{ backgroundColor: getRateBoxBg(settings?.background_color || "#FFF8E1") }}>
                          <AutoFitRate value={currentRates.gold_24k_sale} color={getRateNumberColor(settings?.background_color || "#FFF8E1", settings?.text_color)} />
                        </div>
                      </div>
                      <div className="rounded-xl border-2 border-gold-600 shadow-md flex flex-col overflow-hidden bg-white">
                        <div className="bg-gradient-to-r from-gold-600 to-gold-700 text-white font-gill-ultra text-[10px] sm:text-xs md:text-sm py-0.5 sm:py-1 px-1 text-center uppercase tracking-wider border-b-2 border-gold-800 shrink-0 shadow-sm">
                          EXCHANGE
                        </div>
                        <div className="flex-1 min-h-0 flex justify-center items-center overflow-hidden" style={{ backgroundColor: getRateBoxBg(settings?.background_color || "#FFF8E1") }}>
                          <AutoFitRate value={currentRates.gold_24k_exchange ?? 0} color={getRateNumberColor(settings?.background_color || "#FFF8E1", settings?.text_color)} />
                        </div>
                      </div>
                      <div className="rounded-xl border-2 border-gold-600 shadow-md flex flex-col overflow-hidden bg-white">
                        <div className="bg-gradient-to-r from-gold-600 to-gold-700 text-white font-gill-ultra text-[10px] sm:text-xs md:text-sm py-0.5 sm:py-1 px-1 text-center uppercase tracking-wider border-b-2 border-gold-800 shrink-0 shadow-sm">
                          PURCHASE
                        </div>
                        <div className="flex-1 min-h-0 flex justify-center items-center overflow-hidden" style={{ backgroundColor: getRateBoxBg(settings?.background_color || "#FFF8E1") }}>
                          <AutoFitRate value={currentRates.gold_24k_purchase} color={getRateNumberColor(settings?.background_color || "#FFF8E1", settings?.text_color)} />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 22K Gold */}
                  <div className="flex-1 min-h-0 bg-white rounded-2xl shadow-md p-1.5 sm:p-2.5 border-2 border-gold-400 border-l-4 border-l-jewelry-primary flex flex-col justify-around">
                    <div className="flex justify-between items-center mb-1">
                      <h4 className="font-gill-ultra text-sm sm:text-base md:text-lg lg:text-xl tracking-wide" style={{ color: getRateNumberColor(settings?.background_color || "#FFF8E1", settings?.text_color) }}>22K GOLD</h4>
                      <div className="bg-jewelry-primary rounded-full gold-shimmer flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 flex-shrink-0">
                        <i className="fas fa-crown text-white text-[10px] sm:text-xs"></i>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-1 sm:gap-2 min-h-0 flex-1 items-stretch">
                      <div className="rounded-xl border-2 border-gold-600 shadow-md flex flex-col overflow-hidden bg-white">
                        <div className="bg-gradient-to-r from-gold-600 to-gold-700 text-white font-gill-ultra text-[10px] sm:text-xs md:text-sm py-0.5 sm:py-1 px-1 text-center uppercase tracking-wider border-b-2 border-gold-800 shrink-0 shadow-sm">
                          SALE
                        </div>
                        <div className="flex-1 min-h-0 flex justify-center items-center overflow-hidden" style={{ backgroundColor: getRateBoxBg(settings?.background_color || "#FFF8E1") }}>
                          <AutoFitRate value={currentRates.gold_22k_sale} color={getRateNumberColor(settings?.background_color || "#FFF8E1", settings?.text_color)} />
                        </div>
                      </div>
                      <div className="rounded-xl border-2 border-gold-600 shadow-md flex flex-col overflow-hidden bg-white">
                        <div className="bg-gradient-to-r from-gold-600 to-gold-700 text-white font-gill-ultra text-[10px] sm:text-xs md:text-sm py-0.5 sm:py-1 px-1 text-center uppercase tracking-wider border-b-2 border-gold-800 shrink-0 shadow-sm">
                          EXCHANGE
                        </div>
                        <div className="flex-1 min-h-0 flex justify-center items-center overflow-hidden" style={{ backgroundColor: getRateBoxBg(settings?.background_color || "#FFF8E1") }}>
                          <AutoFitRate value={currentRates.gold_22k_exchange ?? 0} color={getRateNumberColor(settings?.background_color || "#FFF8E1", settings?.text_color)} />
                        </div>
                      </div>
                      <div className="rounded-xl border-2 border-gold-600 shadow-md flex flex-col overflow-hidden bg-white">
                        <div className="bg-gradient-to-r from-gold-600 to-gold-700 text-white font-gill-ultra text-[10px] sm:text-xs md:text-sm py-0.5 sm:py-1 px-1 text-center uppercase tracking-wider border-b-2 border-gold-800 shrink-0 shadow-sm">
                          PURCHASE
                        </div>
                        <div className="flex-1 min-h-0 flex justify-center items-center overflow-hidden" style={{ backgroundColor: getRateBoxBg(settings?.background_color || "#FFF8E1") }}>
                          <AutoFitRate value={currentRates.gold_22k_purchase} color={getRateNumberColor(settings?.background_color || "#FFF8E1", settings?.text_color)} />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 18K Gold */}
                  <div className="flex-1 min-h-0 bg-white rounded-2xl shadow-md p-1.5 sm:p-2.5 border-2 border-gold-400 border-l-4 border-l-jewelry-primary flex flex-col justify-around">
                    <div className="flex justify-between items-center mb-1">
                      <h4 className="font-gill-ultra text-sm sm:text-base md:text-lg lg:text-xl tracking-wide" style={{ color: getRateNumberColor(settings?.background_color || "#FFF8E1", settings?.text_color) }}>18K GOLD</h4>
                      <div className="bg-jewelry-primary rounded-full gold-shimmer flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 flex-shrink-0">
                        <i className="fas fa-gem text-white text-[10px] sm:text-xs"></i>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-1 sm:gap-2 min-h-0 flex-1 items-stretch">
                      <div className="rounded-xl border-2 border-gold-600 shadow-md flex flex-col overflow-hidden bg-white">
                        <div className="bg-gradient-to-r from-gold-600 to-gold-700 text-white font-gill-ultra text-[10px] sm:text-xs md:text-sm py-0.5 sm:py-1 px-1 text-center uppercase tracking-wider border-b-2 border-gold-800 shrink-0 shadow-sm">
                          SALE
                        </div>
                        <div className="flex-1 min-h-0 flex justify-center items-center overflow-hidden" style={{ backgroundColor: getRateBoxBg(settings?.background_color || "#FFF8E1") }}>
                          <AutoFitRate value={currentRates.gold_18k_sale} color={getRateNumberColor(settings?.background_color || "#FFF8E1", settings?.text_color)} />
                        </div>
                      </div>
                      <div className="rounded-xl border-2 border-gold-600 shadow-md flex flex-col overflow-hidden bg-white">
                        <div className="bg-gradient-to-r from-gold-600 to-gold-700 text-white font-gill-ultra text-[10px] sm:text-xs md:text-sm py-0.5 sm:py-1 px-1 text-center uppercase tracking-wider border-b-2 border-gold-800 shrink-0 shadow-sm">
                          EXCHANGE
                        </div>
                        <div className="flex-1 min-h-0 flex justify-center items-center overflow-hidden" style={{ backgroundColor: getRateBoxBg(settings?.background_color || "#FFF8E1") }}>
                          <AutoFitRate value={currentRates.gold_18k_exchange ?? 0} color={getRateNumberColor(settings?.background_color || "#FFF8E1", settings?.text_color)} />
                        </div>
                      </div>
                      <div className="rounded-xl border-2 border-gold-600 shadow-md flex flex-col overflow-hidden bg-white">
                        <div className="bg-gradient-to-r from-gold-600 to-gold-700 text-white font-gill-ultra text-[10px] sm:text-xs md:text-sm py-0.5 sm:py-1 px-1 text-center uppercase tracking-wider border-b-2 border-gold-800 shrink-0 shadow-sm">
                          PURCHASE
                        </div>
                        <div className="flex-1 min-h-0 flex justify-center items-center overflow-hidden" style={{ backgroundColor: getRateBoxBg(settings?.background_color || "#FFF8E1") }}>
                          <AutoFitRate value={currentRates.gold_18k_purchase} color={getRateNumberColor(settings?.background_color || "#FFF8E1", settings?.text_color)} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Silver Rates & Promo Column */}
                <div className="flex flex-col justify-between h-full min-h-0 gap-1.5 sm:gap-2">
                  {/* Silver Rates */}
                  <div className="flex-shrink-0">
                    <h3 className="font-gill-ultra text-center text-xs sm:text-sm md:text-base mb-1 uppercase tracking-wider" style={{ color: getRateNumberColor(settings?.background_color || "#FFF8E1", settings?.text_color) }}>
                      SILVER RATES (Per KG)
                    </h3>
                    
                    <div className="bg-white rounded-2xl shadow-md p-1.5 sm:p-2.5 border-2 border-gold-400 border-l-4 border-l-jewelry-primary">
                      <div className="flex justify-between items-center mb-1">
                        <h4 className="font-gill-ultra text-sm sm:text-base md:text-lg lg:text-xl tracking-wide" style={{ color: getRateNumberColor(settings?.background_color || "#FFF8E1", settings?.text_color) }}>SILVER</h4>
                        <div className="bg-jewelry-primary rounded-full shadow flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 flex-shrink-0">
                          <i className="fas fa-circle text-white text-[10px] sm:text-xs"></i>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-1 sm:gap-2 min-h-0 items-stretch">
                        <div className="rounded-xl border-2 border-gold-600 shadow-md flex flex-col overflow-hidden bg-white">
                          <div className="bg-gradient-to-r from-gold-600 to-gold-700 text-white font-gill-ultra text-[10px] sm:text-xs md:text-sm py-0.5 sm:py-1 px-1 text-center uppercase tracking-wider border-b-2 border-gold-800 shrink-0 shadow-sm">
                            SALE
                          </div>
                          <div className="flex-1 min-h-0 flex justify-center items-center overflow-hidden" style={{ backgroundColor: getRateBoxBg(settings?.background_color || "#FFF8E1") }}>
                            <AutoFitRate value={currentRates.silver_per_kg_sale} color={getRateNumberColor(settings?.background_color || "#FFF8E1", settings?.text_color)} />
                          </div>
                        </div>
                        <div className="rounded-xl border-2 border-gold-600 shadow-md flex flex-col overflow-hidden bg-white">
                          <div className="bg-gradient-to-r from-gold-600 to-gold-700 text-white font-gill-ultra text-[10px] sm:text-xs md:text-sm py-0.5 sm:py-1 px-1 text-center uppercase tracking-wider border-b-2 border-gold-800 shrink-0 shadow-sm">
                            EXCHANGE
                          </div>
                          <div className="flex-1 min-h-0 flex justify-center items-center overflow-hidden" style={{ backgroundColor: getRateBoxBg(settings?.background_color || "#FFF8E1") }}>
                            <AutoFitRate value={currentRates.silver_per_kg_exchange ?? 0} color={getRateNumberColor(settings?.background_color || "#FFF8E1", settings?.text_color)} />
                          </div>
                        </div>
                        <div className="rounded-xl border-2 border-gold-600 shadow-md flex flex-col overflow-hidden bg-white">
                          <div className="bg-gradient-to-r from-gold-600 to-gold-700 text-white font-gill-ultra text-[10px] sm:text-xs md:text-sm py-0.5 sm:py-1 px-1 text-center uppercase tracking-wider border-b-2 border-gold-800 shrink-0 shadow-sm">
                            PURCHASE
                          </div>
                          <div className="flex-1 min-h-0 flex justify-center items-center overflow-hidden" style={{ backgroundColor: getRateBoxBg(settings?.background_color || "#FFF8E1") }}>
                            <AutoFitRate value={currentRates.silver_per_kg_purchase} color={getRateNumberColor(settings?.background_color || "#FFF8E1", settings?.text_color)} />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Promotional Slideshow or Transparent Watermark Area */}
                  {promoImages.length > 0 ? (
                    <div className="bg-gradient-to-br from-gold-100/80 to-gold-200/80 rounded-2xl shadow-md overflow-hidden flex-1 min-h-0 relative flex items-center justify-center border border-gold-300">
                      <div className="relative w-full h-full flex items-center justify-center">
                        <AnimatePresence mode="wait">
                          {currentPromo && (
                            <motion.img
                              key={currentPromo.id}
                              src={currentPromo.image_url || ""}
                              alt={currentPromo.name || "Promotional Image"}
                              className="w-full h-full object-contain p-1"
                              initial="initial"
                              animate="animate"
                              exit="exit"
                              variants={animationVariants}
                              transition={transitionProps}
                            />
                          )}
                        </AnimatePresence>
                        
                        {/* Slideshow Indicators */}
                        {promoImages.length > 1 && (
                          <div className="absolute bottom-1.5 left-1/2 transform -translate-x-1/2 flex space-x-1.5">
                            {promoImages.map((_, index) => (
                              <div
                                key={index}
                                className={`rounded-full transition-colors w-2 h-2 ${
                                  index === currentPromoIndex ? 'bg-gold-600' : 'bg-gold-300'
                                }`}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="flex-1 min-h-0 rounded-2xl border-2 border-gold-400/30 bg-white/30 backdrop-blur-md p-4 flex flex-col items-center justify-center text-center shadow-sm">
                      <img src="/logo.png" alt="Devi Jewellers" className="h-14 sm:h-18 md:h-20 w-auto opacity-80 object-contain mb-2 filter drop-shadow" />
                      <p className="font-gill-ultra text-jewelry-primary text-xs sm:text-sm md:text-base tracking-widest uppercase opacity-90">
                        DEVI JEWELLERS
                      </p>
                      <p className="text-[10px] sm:text-xs md:text-sm text-gray-800 font-bold mt-1 tracking-wide">
                        Purity & Trust Guaranteed
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Footer Banner */}
            {bannerSettings?.banner_image_url && (
              <div 
                className="flex-shrink-0 bg-white border-t-2 md:border-t-4 border-jewelry-primary shadow-md max-h-[10vh] min-h-[40px] flex items-center justify-center p-1"
                style={{ 
                  height: `${Math.min(bannerSettings.banner_height || 80, 80)}px`
                }}
              >
                <img 
                  src={bannerSettings.banner_image_url} 
                  alt="Banner" 
                  className="max-h-full max-w-full object-contain rounded shadow-sm"
                />
              </div>
            )}
          </motion.div>
        ) : (
          currentMedia && (
            <motion.div
              key={`media-${currentMediaIndex}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="w-full h-full flex items-center justify-center bg-black"
            >
              {currentMedia.media_type === "image" ? (
                <img 
                  src={currentMedia.file_url || ""} 
                  alt={currentMedia.name}
                  className="max-w-full max-h-full object-contain"
                />
              ) : (
                <video 
                  src={currentMedia.file_url || ""} 
                  autoPlay 
                  muted 
                  className="max-w-full max-h-full object-contain"
                />
              )}
            </motion.div>
          )
        )}
      </AnimatePresence>
    </div>
  );
}
