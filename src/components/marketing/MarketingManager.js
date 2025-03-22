import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FiPlus, FiCalendar, FiImage, FiTrash2 } from 'react-icons/fi';
import MarketingBanner from './MarketingBanner';

export default function MarketingManager() {
  const [banners, setBanners] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAdding, setIsAdding] = useState(false);
  const [newBanner, setNewBanner] = useState({
    title: '',
    description: '',
    imageQuery: '',
    startDate: '',
    endDate: ''
  });

  const handleUnsplashSearch = async () => {
    try {
      const response = await fetch(
        `https://api.unsplash.com/search/photos?query=${newBanner.imageQuery}&client_id=YOUR_UNSPLASH_API_KEY`
      );
      const data = await response.json();
      if (data.results.length > 0) {
        const imageUrl = data.results[0].urls.regular;
        const bannerId = Date.now().toString();
        setBanners([...banners, {
          id: bannerId,
          title: newBanner.title,
          description: newBanner.description,
          imageUrl,
          startDate: newBanner.startDate,
          endDate: newBanner.endDate
        }]);
        setIsAdding(false);
        setNewBanner({
          title: '',
          description: '',
          imageQuery: '',
          startDate: '',
          endDate: ''
        });
      }
    } catch (error) {
      console.error('Error fetching image:', error);
    }
  };

  const deleteBanner = (bannerId) => {
    setBanners(banners.filter(banner => banner.id !== bannerId));
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Marketing Materials</h2>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsAdding(true)}
          className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg shadow hover:bg-primary-700"
        >
          <FiPlus className="mr-2" />
          Add New Banner
        </motion.button>
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

      {/* Add new banner form */}
      {isAdding && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg shadow p-6 mb-6"
        >
          <h3 className="text-lg font-medium text-gray-900 mb-4">Add New Banner</h3>
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Title</label>
              <input
                type="text"
                value={newBanner.title}
                onChange={(e) => setNewBanner({ ...newBanner, title: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Description</label>
              <textarea
                value={newBanner.description}
                onChange={(e) => setNewBanner({ ...newBanner, description: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                rows="3"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Image Search Query</label>
              <div className="mt-1 flex rounded-md shadow-sm">
                <input
                  type="text"
                  value={newBanner.imageQuery}
                  onChange={(e) => setNewBanner({ ...newBanner, imageQuery: e.target.value })}
                  className="flex-1 rounded-l-md border-gray-300 focus:border-primary-500 focus:ring-primary-500"
                  placeholder="e.g., coffee shop promotion"
                />
                <button
                  onClick={handleUnsplashSearch}
                  className="inline-flex items-center px-4 py-2 border border-l-0 border-gray-300 rounded-r-md bg-gray-50 text-gray-700 hover:bg-gray-100"
                >
                  <FiImage className="mr-2" />
                  Search
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Start Date</label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <input
                    type="date"
                    value={newBanner.startDate}
                    onChange={(e) => setNewBanner({ ...newBanner, startDate: e.target.value })}
                    className="block w-full rounded-md border-gray-300 focus:border-primary-500 focus:ring-primary-500"
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
                    onChange={(e) => setNewBanner({ ...newBanner, endDate: e.target.value })}
                    className="block w-full rounded-md border-gray-300 focus:border-primary-500 focus:ring-primary-500"
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
              onClick={() => setIsAdding(false)}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleUnsplashSearch}
              className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
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
                </div>
              </div>
              <button
                onClick={() => deleteBanner(banner.id)}
                className="p-2 text-red-600 hover:text-red-800"
              >
                <FiTrash2 />
              </button>
            </motion.li>
          ))}
        </ul>
      </div>
    </div>
  );
} 