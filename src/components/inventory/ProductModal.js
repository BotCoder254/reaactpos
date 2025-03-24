import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiSearch, FiTrash2 } from 'react-icons/fi';
import { useInventory } from '../../contexts/InventoryContext';
import toast from 'react-hot-toast';

export default function ProductModal({ isOpen, onClose, product, onRefetch }) {
  const { addProduct, updateProduct, deleteProductImage } = useInventory();
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    price: '',
    stock: '',
    description: '',
    supplier: '',
    minStockThreshold: '',
    imageQuery: '',
  });
  const [searchResults, setSearchResults] = useState([]);
  const [selectedImages, setSelectedImages] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || '',
        category: product.category || '',
        price: product.price?.toString() || '',
        stock: product.stock?.toString() || '',
        description: product.description || '',
        supplier: product.supplier || '',
        minStockThreshold: product.minStockThreshold?.toString() || '',
        imageQuery: '',
      });
      if (product.images && Array.isArray(product.images)) {
        const images = product.images.map(img => typeof img === 'string' ? { url: img } : img);
        setSelectedImages(images);
      } else {
        setSelectedImages([]);
      }
    } else {
      resetForm();
    }
  }, [product]);

  const resetForm = () => {
    setFormData({
      name: '',
      category: '',
      price: '',
      stock: '',
      description: '',
      supplier: '',
      minStockThreshold: '',
      imageQuery: '',
    });
    setSelectedImages([]);
    setSearchResults([]);
  };

  const handleUnsplashSearch = async () => {
    if (!formData.imageQuery) return;
    
    try {
      setLoading(true);
      const response = await fetch(
        `https://api.unsplash.com/search/photos?query=${encodeURIComponent(formData.imageQuery)}&per_page=20`,
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
    };
    
    setSelectedImages(prev => {
      const exists = prev.some(img => img.unsplashId === image.id);
      if (exists) return prev;
      return [...prev, imageData];
    });
  };

  const handleRemoveImage = async (index) => {
    if (product && index < selectedImages.length) {
      try {
        setLoading(true);
        const imageToDelete = selectedImages[index];
        await deleteProductImage(product.id, imageToDelete);
        setSelectedImages(prev => prev.filter((_, i) => i !== index));
        toast.success('Image removed successfully');
      } catch (error) {
        console.error('Error removing image:', error);
        toast.error('Failed to remove image');
      } finally {
        setLoading(false);
      }
    } else {
      setSelectedImages(prev => prev.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const productData = {
        name: formData.name,
        category: formData.category,
        price: Number(formData.price),
        stock: Number(formData.stock),
        description: formData.description,
        supplier: formData.supplier,
        minStockThreshold: Number(formData.minStockThreshold) || 10,
        images: selectedImages,
      };

      if (product) {
        await updateProduct(product.id, productData);
        toast.success('Product updated successfully');
      } else {
        await addProduct(productData);
        toast.success('Product added successfully');
      }

      onRefetch?.();
      onClose();
      resetForm();
    } catch (error) {
      console.error('Error saving product:', error);
      setError(error.message);
      toast.error(error.message || 'Failed to save product');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        >
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                {product ? 'Edit Product' : 'Add New Product'}
              </h2>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-500"
              >
                <FiX className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Category</label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
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
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Stock</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Supplier</label>
                  <input
                    type="text"
                    value={formData.supplier}
                    onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Min Stock Threshold</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.minStockThreshold}
                    onChange={(e) => setFormData({ ...formData, minStockThreshold: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows="3"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Images</label>
                <div className="mt-1 flex items-center space-x-2">
                  <input
                    type="text"
                    value={formData.imageQuery}
                    onChange={(e) => setFormData({ ...formData, imageQuery: e.target.value })}
                    placeholder="Search Unsplash images..."
                    className="flex-1 border border-gray-300 rounded-md shadow-sm p-2"
                  />
                  <button
                    type="button"
                    onClick={handleUnsplashSearch}
                    disabled={loading}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                  >
                    <FiSearch className="w-5 h-5" />
                  </button>
                </div>

                {selectedImages.length > 0 && (
                  <div className="mt-4 grid grid-cols-3 gap-4">
                    {selectedImages.map((image, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={image.thumb || image.url}
                          alt={`Selected ${index + 1}`}
                          className="h-24 w-full object-cover rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(index)}
                          disabled={loading}
                          className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <FiTrash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
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
                          className={`relative cursor-pointer rounded-lg overflow-hidden h-24 ${
                            selectedImages.some(img => img.unsplashId === image.id)
                              ? 'ring-2 ring-primary-500'
                              : ''
                          }`}
                        >
                          <img
                            src={image.urls.thumb}
                            alt={image.alt_description}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {error && (
                <div className="text-red-500 text-sm">{error}</div>
              )}

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
                  {isSubmitting ? 'Saving...' : product ? 'Update Product' : 'Add Product'}
                </button>
              </div>
            </form>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
} 