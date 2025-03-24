import React, { useState } from 'react';
import { FiSearch, FiTrash2 } from 'react-icons/fi';
import { addProduct } from '../../utils/inventoryQueries';
import toast from 'react-hot-toast';

function AddProductModal({ isOpen, onClose, onProductAdded }) {
  const [product, setProduct] = useState({
    name: '',
    price: '',
    description: '',
    stock: '',
    category: '',
    supplier: '',
    minStockThreshold: '10',
  });
  const [imageQuery, setImageQuery] = useState('');
  const [selectedImages, setSelectedImages] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleUnsplashSearch = async () => {
    if (!imageQuery) return;
    
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(
        `https://api.unsplash.com/search/photos?query=${encodeURIComponent(imageQuery)}&per_page=20`,
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
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleImageSelect = (image) => {
    const imageData = {
      url: image.urls.regular,
      thumb: image.urls.thumb,
      unsplashId: image.id,
      photographer: image.user.name,
      photographerUrl: image.user.links.html,
      downloadLocation: image.links.download_location
    };
    
    setSelectedImages(prev => {
      const exists = prev.some(img => img.unsplashId === image.id);
      if (exists) return prev;
      return [...prev, imageData];
    });
  };

  const handleRemoveImage = (index) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);

      const productData = {
        ...product,
        price: Number(product.price),
        stock: Number(product.stock),
        minStockThreshold: Number(product.minStockThreshold),
        images: selectedImages,
        createdAt: new Date()
      };

      await addProduct(productData);
      toast.success('Product added successfully!');
      onProductAdded();
      onClose();
      
      // Reset form
      setProduct({
        name: '',
        price: '',
        description: '',
        stock: '',
        category: '',
        supplier: '',
        minStockThreshold: '10',
      });
      setSelectedImages([]);
      setImageQuery('');
      setSearchResults([]);
    } catch (error) {
      console.error('Error adding product:', error);
      toast.error('Failed to add product');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Add New Product</h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Product details fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <input
                  type="text"
                  required
                  value={product.name}
                  onChange={(e) => setProduct({ ...product, name: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Category</label>
                <input
                  type="text"
                  value={product.category}
                  onChange={(e) => setProduct({ ...product, category: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Price</label>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={product.price}
                  onChange={(e) => setProduct({ ...product, price: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Stock</label>
                <input
                  type="number"
                  required
                  min="0"
                  value={product.stock}
                  onChange={(e) => setProduct({ ...product, stock: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Supplier</label>
                <input
                  type="text"
                  value={product.supplier}
                  onChange={(e) => setProduct({ ...product, supplier: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Min Stock Threshold</label>
                <input
                  type="number"
                  min="0"
                  value={product.minStockThreshold}
                  onChange={(e) => setProduct({ ...product, minStockThreshold: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Description</label>
              <textarea
                value={product.description}
                onChange={(e) => setProduct({ ...product, description: e.target.value })}
                rows="3"
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
              />
            </div>

            {/* Image search and selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Images</label>
              <div className="mt-1 flex items-center space-x-2">
                <input
                  type="text"
                  value={imageQuery}
                  onChange={(e) => setImageQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleUnsplashSearch())}
                  placeholder="Search Unsplash images..."
                  className="flex-1 border border-gray-300 rounded-md shadow-sm p-2"
                />
                <button
                  type="button"
                  onClick={handleUnsplashSearch}
                  disabled={loading}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 disabled:opacity-50"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                  ) : (
                    <FiSearch className="w-5 h-5" />
                  )}
                </button>
              </div>

              {selectedImages.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Selected Images</h4>
                  <div className="grid grid-cols-3 gap-4">
                    {selectedImages.map((image, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={image.thumb}
                          alt={`Selected ${index + 1}`}
                          className="h-24 w-full object-cover rounded-lg"
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-opacity rounded-lg" />
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(index)}
                          className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <FiTrash2 className="w-4 h-4" />
                        </button>
                        {image.photographer && (
                          <a
                            href={image.photographerUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="absolute bottom-1 left-1 text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            Photo by {image.photographer}
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {searchResults.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Search Results</h4>
                  <div className="grid grid-cols-3 gap-4">
                    {searchResults.map((image) => (
                      <div
                        key={image.id}
                        onClick={() => handleImageSelect(image)}
                        className={`relative cursor-pointer rounded-lg overflow-hidden group ${
                          selectedImages.some(img => img.unsplashId === image.id)
                            ? 'ring-2 ring-primary-500'
                            : ''
                        }`}
                      >
                        <img
                          src={image.urls.thumb}
                          alt={image.alt_description}
                          className="w-full h-24 object-cover"
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-opacity" />
                        {image.user.name && (
                          <div className="absolute bottom-1 left-1 right-1 text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity truncate">
                            Photo by {image.user.name}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {error && (
                <div className="mt-2 text-sm text-red-600">{error}</div>
              )}
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || loading}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50"
              >
                {isSubmitting ? 'Adding...' : 'Add Product'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default AddProductModal; 