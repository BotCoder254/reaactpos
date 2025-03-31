import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiSearch, FiTrash2, FiUpload, FiImage } from 'react-icons/fi';
import { useInventory } from '../../contexts/InventoryContext';
import { storage } from '../../firebase';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
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
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [previewImages, setPreviewImages] = useState([]);

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
    setUploadedFiles([]);
    setPreviewImages([]);
  };

  const uploadImagesToStorage = async (files) => {
    try {
      const uploadPromises = files.map(async (file) => {
        const storageRef = ref(storage, `products/${Date.now()}_${file.name}`);
        const snapshot = await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(snapshot.ref);
        
        return {
          url: downloadURL,
          thumb: downloadURL,
          type: 'uploaded',
          name: file.name,
          path: snapshot.ref.fullPath
        };
      });

      return await Promise.all(uploadPromises);
    } catch (error) {
      console.error('Error uploading images:', error);
      throw new Error('Failed to upload images');
    }
  };

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter(file => file && file.type.startsWith('image/'));
    
    if (validFiles.length === 0) {
      toast.error('Please select valid image files');
      return;
    }

    try {
      setLoading(true);
      
      // Create temporary preview URLs
      const newPreviewImages = validFiles.map(file => ({
        file,
        previewUrl: URL.createObjectURL(file),
        type: 'uploaded',
        name: file.name || 'Uploaded image'
      }));

      setPreviewImages(prev => [...prev, ...newPreviewImages]);
      
      // Upload files to storage and get URLs
      const uploadedImages = await uploadImagesToStorage(validFiles);
      
      // Validate uploaded images before adding them
      const validUploadedImages = uploadedImages.filter(img => img && img.url && img.url.trim() !== '');
      
      if (validUploadedImages.length === 0) {
        throw new Error('Failed to upload images');
      }
      
      // Add uploaded images to selected images
      setSelectedImages(prev => [...prev, ...validUploadedImages]);
      
      // Cleanup preview URLs
      newPreviewImages.forEach(preview => {
        if (preview.previewUrl) {
          URL.revokeObjectURL(preview.previewUrl);
        }
      });
      
      toast.success('Images uploaded successfully');
    } catch (error) {
      console.error('Error handling file upload:', error);
      toast.error(error.message || 'Failed to upload images');
    } finally {
      setLoading(false);
    }
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
    if (!image || !image.urls) return;

    const imageData = {
      url: image.urls.regular || '',
      thumb: image.urls.thumb || image.urls.regular || '',
      unsplashId: image.id || null,
      photographer: image.user?.name || null,
      type: 'unsplash'
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
        
        // Delete from storage if it's an uploaded image
        if (imageToDelete.type === 'uploaded' && imageToDelete.path) {
          const imageRef = ref(storage, imageToDelete.path);
          await deleteObject(imageRef);
        }
        
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
      // Validate required fields
      if (!formData.name?.trim()) throw new Error('Product name is required');
      if (!formData.category?.trim()) throw new Error('Category is required');
      if (!formData.price || isNaN(Number(formData.price))) throw new Error('Valid price is required');
      if (!formData.stock || isNaN(Number(formData.stock))) throw new Error('Valid stock quantity is required');

      // Format the product data
      const productData = {
        name: formData.name.trim(),
        category: formData.category.trim(),
        price: Number(formData.price),
        stock: Number(formData.stock),
        description: formData.description?.trim() || '',
        supplier: formData.supplier?.trim() || '',
        minStockThreshold: Number(formData.minStockThreshold) || 10,
        images: selectedImages.map(image => ({
          url: image.url || '',
          thumb: image.thumb || image.url || '',
          type: image.type || 'url',
          photographer: image.photographer || null,
          unsplashId: image.unsplashId || null,
          name: image.name || null,
          path: image.path || null
        })).filter(img => img.url && img.url.trim() !== '')
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
      setError(error.message || 'Failed to save product');
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
                <label className="block text-sm font-medium text-gray-700 mb-2">Images</label>
                
                {/* Image Upload Section */}
                <div className="mb-4">
                  <label className="flex flex-col items-center px-4 py-6 bg-white border-2 border-gray-300 border-dashed rounded-lg cursor-pointer hover:bg-gray-50">
                    <FiUpload className="w-8 h-8 text-gray-400" />
                    <span className="mt-2 text-sm text-gray-500">Upload images</span>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>

                {/* Unsplash Search Section */}
                <div className="mt-4">
                  <div className="flex items-center space-x-2">
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
                </div>

                {/* Selected Images Preview */}
                {selectedImages.length > 0 && (
                  <div className="mt-4 grid grid-cols-3 gap-4">
                    {selectedImages.map((image, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={image.thumb || image.url}
                          alt={`Selected ${index + 1}`}
                          className="h-24 w-full object-cover rounded-lg"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = 'https://via.placeholder.com/400x300?text=No+Image';
                            e.target.className = "w-full h-24 object-contain rounded-lg bg-gray-100";
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(index)}
                          disabled={loading}
                          className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <FiTrash2 className="w-4 h-4" />
                        </button>
                        {image.photographer && (
                          <div className="absolute bottom-1 left-1 right-1">
                            <span className="text-xs text-white bg-black bg-opacity-50 px-2 py-1 rounded-full block truncate">
                              Photo by {image.photographer}
                            </span>
                          </div>
                        )}
                        {image.type === 'uploaded' && (
                          <div className="absolute bottom-1 left-1 right-1">
                            <span className="text-xs text-white bg-black bg-opacity-50 px-2 py-1 rounded-full block truncate">
                              Uploaded: {image.name || 'Image'}
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Unsplash Search Results */}
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
                          <div className="absolute bottom-1 left-1 right-1">
                            <span className="text-xs text-white bg-black bg-opacity-50 px-2 py-1 rounded-full block truncate">
                              By {image.user.name}
                            </span>
                          </div>
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