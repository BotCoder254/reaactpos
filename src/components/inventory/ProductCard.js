import React, { useState, useEffect } from 'react';
import { FiEdit2, FiTrash2, FiImage } from 'react-icons/fi';
import { useInventory } from '../../contexts/InventoryContext';
import { formatCurrency } from '../../utils/formatCurrency';

export default function ProductCard({ product, onEdit, isManager }) {
  const { deleteProduct } = useInventory();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [validImages, setValidImages] = useState([]);

  useEffect(() => {
    const validateImages = () => {
      if (!product.images || !Array.isArray(product.images)) {
        setValidImages([]);
        return;
      }

      const validUrls = product.images
        .filter(image => {
          if (!image) return false;
          if (typeof image === 'string') return image.startsWith('http');
          return image.url && image.url.startsWith('http');
        })
        .map(image => ({
          url: typeof image === 'string' ? image : image.url,
          thumb: image.thumb || image.url,
          photographer: image.photographer || null,
          unsplashId: image.unsplashId || null,
          type: image.type || 'url',
          name: image.name || null
        }));

      setValidImages(validUrls);
    };

    validateImages();
  }, [product.images]);

  const handleDelete = async () => {
    if (window.confirm(`Are you sure you want to delete ${product.name}?`)) {
      try {
        await deleteProduct(product.id, product.name);
      } catch (error) {
        console.error('Error deleting product:', error);
      }
    }
  };

  const nextImage = () => {
    if (validImages.length > 1) {
      setCurrentImageIndex((prev) =>
        prev === validImages.length - 1 ? 0 : prev + 1
      );
    }
  };

  const handleImageError = (e) => {
    e.target.onerror = null;
    e.target.src = 'https://via.placeholder.com/400x300?text=No+Image';
  };

  const getStockStatusColor = () => {
    if (product.stock === 0) return 'bg-red-100 text-red-800';
    if (product.stock <= (product.minStockThreshold || 10)) return 'bg-yellow-100 text-yellow-800';
    return 'bg-green-100 text-green-800';
  };

  const getStockStatusText = () => {
    if (product.stock === 0) return 'Out of Stock';
    if (product.stock <= (product.minStockThreshold || 10)) return 'Low Stock';
    return 'In Stock';
  };

  const getImageAttribution = () => {
    const currentImage = validImages[currentImageIndex];
    if (!currentImage) return null;

    if (currentImage.type === 'unsplash' && currentImage.photographer) {
      return `Photo by ${currentImage.photographer}`;
    } else if (currentImage.type === 'uploaded' && currentImage.name) {
      return `Uploaded: ${currentImage.name}`;
    }
    return null;
  };

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      <div className="relative">
        {validImages.length > 0 ? (
          <>
            <img
              src={validImages[currentImageIndex].url}
              alt={product.name}
              className="w-full h-48 object-cover cursor-pointer"
              onClick={nextImage}
              onError={handleImageError}
            />
            {validImages.length > 1 && (
              <div className="absolute bottom-2 right-2 flex space-x-1">
                <button
                  onClick={nextImage}
                  className="p-1 bg-black bg-opacity-50 rounded-full text-white"
                >
                  <FiImage className="w-4 h-4" />
                </button>
                <span className="p-1 bg-black bg-opacity-50 rounded-full text-white text-xs">
                  {currentImageIndex + 1}/{validImages.length}
                </span>
              </div>
            )}
            {getImageAttribution() && (
              <div className="absolute bottom-2 left-2">
                <span className="text-xs text-white bg-black bg-opacity-50 px-2 py-1 rounded-full">
                  {getImageAttribution()}
                </span>
              </div>
            )}
          </>
        ) : (
          <div className="w-full h-48 bg-gray-100 flex items-center justify-center">
            <FiImage className="w-8 h-8 text-gray-400" />
          </div>
        )}
        <span
          className={`absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-medium ${getStockStatusColor()}`}
        >
          {getStockStatusText()}
        </span>
      </div>

      <div className="p-4">
        <div className="mb-2">
          <h3 className="text-lg font-medium text-gray-900">{product.name}</h3>
          {product.category && (
            <p className="text-sm text-gray-500">{product.category}</p>
          )}
        </div>

        <div className="mb-4">
          <p className="text-xl font-semibold text-gray-900">{formatCurrency(product.price)}</p>
          <p className="text-sm text-gray-500">Stock: {product.stock}</p>
          {product.supplier && (
            <p className="text-sm text-gray-500">Supplier: {product.supplier}</p>
          )}
          {product.description && (
            <p className="text-sm text-gray-500 mt-2">{product.description}</p>
          )}
        </div>

        {isManager && (
          <div className="flex justify-end space-x-2">
            <button
              onClick={() => onEdit(product)}
              className="p-2 text-gray-600 hover:text-primary-600 rounded"
            >
              <FiEdit2 className="w-4 h-4" />
            </button>
            <button
              onClick={handleDelete}
              className="p-2 text-gray-600 hover:text-red-600 rounded"
            >
              <FiTrash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
} 