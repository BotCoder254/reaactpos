import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiPercent, FiTag, FiX } from 'react-icons/fi';
import { getActiveDiscounts } from '../../utils/discountQueries';

export default function DiscountBanner() {
  const [discounts, setDiscounts] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const fetchDiscounts = async () => {
      try {
        const activeDiscounts = await getActiveDiscounts();
        setDiscounts(activeDiscounts);
      } catch (error) {
        console.error('Error fetching active discounts:', error);
      }
    };

    fetchDiscounts();
    const interval = setInterval(fetchDiscounts, 300000); // Refresh every 5 minutes
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (discounts.length > 1) {
      const interval = setInterval(() => {
        setCurrentIndex((prevIndex) => (prevIndex + 1) % discounts.length);
      }, 5000); // Rotate every 5 seconds
      return () => clearInterval(interval);
    }
  }, [discounts.length]);

  if (!isVisible || discounts.length === 0) return null;

  const currentDiscount = discounts[currentIndex];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: 'auto', opacity: 1 }}
        exit={{ height: 0, opacity: 0 }}
        className="bg-primary-600 text-white relative z-20"
      >
        <div className="ml-0 md:ml-64 py-3 px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center">
            <div className="flex items-center">
              {currentDiscount.type === 'percentage' ? (
                <FiPercent className="h-6 w-6 mr-2" />
              ) : (
                <FiTag className="h-6 w-6 mr-2" />
              )}
              <motion.p
                key={currentDiscount.id}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -20, opacity: 0 }}
                className="font-medium text-white"
              >
                <span className="md:hidden">
                  {currentDiscount.type === 'percentage'
                    ? `${currentDiscount.value}% OFF`
                    : 'BOGO DEAL'}
                </span>
                <span className="hidden md:inline">
                  {currentDiscount.type === 'percentage'
                    ? `${currentDiscount.value}% off ${currentDiscount.name}`
                    : `Buy One Get One Free - ${currentDiscount.name}`}
                  {currentDiscount.minPurchase > 0 &&
                    ` (Min. purchase: $${currentDiscount.minPurchase})`}
                </span>
              </motion.p>
            </div>
            {discounts.length > 1 && (
              <div className="hidden sm:flex items-center ml-4 space-x-1">
                {discounts.map((_, index) => (
                  <div
                    key={index}
                    className={`h-1.5 w-1.5 rounded-full ${
                      index === currentIndex
                        ? 'bg-white'
                        : 'bg-primary-400'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
          <button
            onClick={() => setIsVisible(false)}
            className="absolute top-1/2 right-4 transform -translate-y-1/2 rounded-md p-1 hover:bg-primary-500 focus:outline-none"
          >
            <FiX className="h-5 w-5 text-white" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
} 