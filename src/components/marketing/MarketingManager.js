import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import MarketingBanner from './MarketingBanner';
import { db } from '../../config/firebase';
import { collection, getDocs, query, Timestamp } from 'firebase/firestore';
import { useAuth } from '../../contexts/AuthContext';

export default function MarketingManager() {
  const [banners, setBanners] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [error, setError] = useState(null);
  const { userRole } = useAuth();

  // Fetch banners on component mount
  useEffect(() => {
    fetchBanners();
  }, []);

  // Auto-slide banners every 5 seconds
  useEffect(() => {
    if (banners.length > 1) {
      const timer = setInterval(() => {
        setCurrentIndex((prevIndex) => (prevIndex + 1) % banners.length);
      }, 5000);
      return () => clearInterval(timer);
    }
  }, [banners.length]);

  const fetchBanners = async () => {
    try {
      const bannersRef = collection(db, 'marketingBanners');
      const q = query(bannersRef);
      const querySnapshot = await getDocs(q);
      
      const now = Timestamp.now();
      const fetchedBanners = querySnapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        .filter(banner => {
          const startDate = new Date(banner.startDate);
          const endDate = new Date(banner.endDate);
          const currentDate = now.toDate();
          return startDate <= currentDate && endDate >= currentDate;
        })
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      setBanners(fetchedBanners);
    } catch (error) {
      console.error('Error fetching banners:', error);
      setError('Failed to load banners');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Marketing Materials</h2>
      </div>

      {/* Preview current banner */}
      {banners.length > 0 && (
        <div className="mb-8">
          <MarketingBanner banners={banners} currentIndex={currentIndex} />
          <div className="flex justify-center mt-4">
            {banners.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`mx-1 w-3 h-3 rounded-full ${
                  index === currentIndex ? 'bg-primary-600' : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
        </div>
      )}

      {/* Existing banners list */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <ul className="divide-y divide-gray-200">
          {banners.map((banner) => (
            <motion.li
              key={banner.id}
              layout
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="p-4 flex items-center justify-between hover:bg-gray-50"
            >
              <div className="flex items-center space-x-4">
                <img
                  src={banner.imageUrl}
                  alt={banner.title}
                  className="w-16 h-16 rounded-lg object-cover"
                />
                <div>
                  <h4 className="text-lg font-medium text-gray-900">{banner.title}</h4>
                  <p className="text-sm text-gray-500">
                    {new Date(banner.startDate).toLocaleDateString()} - {new Date(banner.endDate).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </motion.li>
          ))}
        </ul>
      </div>

      {error && (
        <div className="mt-4 p-3 bg-red-50 border-l-4 border-red-500 text-red-700">
          {error}
        </div>
      )}
    </div>
  );
} 