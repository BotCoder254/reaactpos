import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiPlus, FiCalendar, FiImage, FiSearch, FiTrash2 } from 'react-icons/fi';
import MarketingBanner from './MarketingBanner';
import { db } from '../../firebase';
import { collection, getDocs, query, Timestamp, addDoc, deleteDoc, doc } from 'firebase/firestore';
import { useAuth } from '../../contexts/AuthContext';

export default function MarketingManager() {
  const [banners, setBanners] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAdding, setIsAdding] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [error, setError] = useState(null);
  const { userRole } = useAuth();
  const [newBanner, setNewBanner] = useState({
    title: '',
    description: '',
    imageQuery: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  });

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

  const handleUnsplashSearch = async () => {
    if (!newBanner.imageQuery) return;
    
    try {
      setError(null);
      const response = await fetch(
        `https://api.unsplash.com/search/photos?query=${encodeURIComponent(newBanner.imageQuery)}&per_page=20`,
        {
          headers: {
            'Authorization': `Client-ID oRz__lKi7bWKvEFhKhT2ighN2aJcWZ_BwPB-JIkelBk`
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Unsplash API error: ${response.status}`);
      }

      const data = await response.json();
      setSearchResults(data.results || []);
    } catch (error) {
      console.error('Error fetching images:', error);
      setError('Failed to fetch images. Please try again.');
    }
  };

  const handleImageSelect = (image) => {
    setSelectedImage(image);
  };

  const handleCreateBanner = async () => {
    if (!selectedImage || !newBanner.title || !newBanner.startDate || !newBanner.endDate) return;

    try {
      const bannersRef = collection(db, 'marketingBanners');
      const bannerData = {
        title: newBanner.title,
        description: newBanner.description,
        imageUrl: selectedImage.urls.regular,
        startDate: newBanner.startDate,
        endDate: newBanner.endDate,
        createdAt: new Date().toISOString()
      };

      await addDoc(bannersRef, bannerData);
      await fetchBanners(); // Refresh banners list
      
      setIsAdding(false);
      setSelectedImage(null);
      setSearchResults([]);
      setNewBanner({
        title: '',
        description: '',
        imageQuery: '',
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      });
    } catch (error) {
      console.error('Error creating banner:', error);
      setError('Failed to create banner');
    }
  };

  const handleDeleteBanner = async (bannerId) => {
    try {
      const bannerRef = doc(db, 'marketingBanners', bannerId);
      await deleteDoc(bannerRef);
      await fetchBanners(); // Refresh banners list
    } catch (error) {
      console.error('Error deleting banner:', error);
      setError('Failed to delete banner');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          {userRole === 'manager' ? 'Marketing Materials' : 'Active Promotions'}
        </h2>
        {userRole === 'manager' && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsAdding(true)}
            className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg shadow hover:bg-primary-700"
          >
            <FiPlus className="mr-2" />
            Add New Banner
          </motion.button>
        )}
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

      {/* Add new banner form - Only for managers */}
      {isAdding && userRole === 'manager' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg shadow p-6 mb-6"
        >
          <h3 className="text-lg font-medium text-gray-900 mb-4">Add New Banner</h3>
          {error && (
            <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-500 text-red-700">
              {error}
            </div>
          )}
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Title</label>
              <input
                type="text"
                value={newBanner.title}
                onChange={(e) => setNewBanner({ ...newBanner, title: e.target.value })}
                className="mt-1 block w-full h-10 px-3 rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                placeholder="Enter banner title"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Description</label>
              <textarea
                value={newBanner.description}
                onChange={(e) => setNewBanner({ ...newBanner, description: e.target.value })}
                className="mt-1 block w-full px-3 py-2 rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                rows="3"
                placeholder="Enter banner description"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Image Search</label>
              <div className="mt-1 flex rounded-md shadow-sm">
                <input
                  type="text"
                  value={newBanner.imageQuery}
                  onChange={(e) => setNewBanner({ ...newBanner, imageQuery: e.target.value })}
                  className="flex-1 h-10 px-3 rounded-l-md border-gray-300 focus:border-primary-500 focus:ring-primary-500"
                  placeholder="Search Unsplash images..."
                />
                <button
                  onClick={handleUnsplashSearch}
                  className="inline-flex items-center px-4 py-2 border border-l-0 border-gray-300 rounded-r-md bg-gray-50 text-gray-700 hover:bg-gray-100"
                >
                  <FiSearch className="mr-2" />
                  Search
                </button>
              </div>
            </div>
            
            {/* Image search results */}
            {searchResults.length > 0 && (
              <div className="grid grid-cols-3 gap-4 mt-4">
                {searchResults.map((image) => (
                  <div
                    key={image.id}
                    onClick={() => handleImageSelect(image)}
                    className={`relative cursor-pointer rounded-lg overflow-hidden h-32 ${
                      selectedImage?.id === image.id ? 'ring-2 ring-primary-500' : ''
                    }`}
                  >
                    <img
                      src={image.urls.small}
                      alt={image.alt_description}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Start Date</label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <input
                    type="date"
                    value={newBanner.startDate}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={(e) => setNewBanner({ ...newBanner, startDate: e.target.value })}
                    className="block w-full h-10 px-3 rounded-md border-gray-300 focus:border-primary-500 focus:ring-primary-500"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <FiCalendar className="text-gray-400" />
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">End Date</label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <input
                    type="date"
                    value={newBanner.endDate}
                    min={newBanner.startDate}
                    onChange={(e) => setNewBanner({ ...newBanner, endDate: e.target.value })}
                    className="block w-full h-10 px-3 rounded-md border-gray-300 focus:border-primary-500 focus:ring-primary-500"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <FiCalendar className="text-gray-400" />
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-4 flex justify-end space-x-3">
            <button
              onClick={() => {
                setIsAdding(false);
                setSelectedImage(null);
                setSearchResults([]);
              }}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleCreateBanner}
              disabled={!selectedImage || !newBanner.title || !newBanner.startDate || !newBanner.endDate}
              className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Create Banner
            </button>
          </div>
        </motion.div>
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
                  {banner.description && (
                    <p className="text-sm text-gray-600 mt-1">{banner.description}</p>
                  )}
                </div>
              </div>
              {userRole === 'manager' && (
                <button
                  onClick={() => handleDeleteBanner(banner.id)}
                  className="p-2 text-red-600 hover:text-red-800"
                >
                  <FiTrash2 className="w-5 h-5" />
                </button>
              )}
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