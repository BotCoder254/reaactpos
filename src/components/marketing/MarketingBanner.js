import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function MarketingBanner({ banners, currentIndex }) {
  if (!banners || banners.length === 0) {
    return null;
  }

  return (
    <div className="relative w-full h-64 overflow-hidden rounded-lg shadow-lg">
      <AnimatePresence initial={false} mode="wait">
        {banners.map((banner, index) => (
          index === currentIndex && (
            <motion.div
              key={banner.id}
              className="absolute inset-0"
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
            >
              <img
                src={banner.imageUrl}
                alt={banner.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent">
                <div className="absolute bottom-0 left-0 p-6">
                  <motion.h3
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="text-2xl font-bold text-white mb-2"
                  >
                    {banner.title}
                  </motion.h3>
                  <motion.p
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="text-white/90"
                  >
                    {banner.description}
                  </motion.p>
                </div>
              </div>
            </motion.div>
          )
        ))}
      </AnimatePresence>
      
      {/* Slide indicators */}
      <div className="absolute bottom-4 right-4 flex space-x-2">
        {banners.map((_, index) => (
          <div
            key={index}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              index === currentIndex ? 'bg-white scale-125' : 'bg-white/50'
            }`}
          />
        ))}
      </div>
    </div>
  );
} 