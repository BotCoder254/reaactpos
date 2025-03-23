import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiEdit2, FiTrash2, FiImage } from 'react-icons/fi';
import { useInventory } from '../../contexts/InventoryContext';
import { formatCurrency } from '../../utils/formatCurrency';

export default function ProductCard({ product, onEdit, isManager }) {
  const { deleteProduct } = useInventory();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [validImages, setValidImages] = useState([]);

  useEffect(() => {
    const validateImages = async () => {
      if (!product.images || !Array.isArray(product.images)) {
        setValidImages([]);
        return;
      }

      const validUrls = product.images.filter(url => url && typeof url === 'string');
      setValidImages(validUrls);
    };

    validateImages();
  }, [product.images]);

  const handleDelete = async () => {
    if (window.confirm(`Are you sure you want to delete ${product.name}?`)) {
      await deleteProduct(product.id, product.name);
    }
  };

  const nextImage = () => {
    if (validImages.length > 1) {
      setCurrentImageIndex((prev) =>
        prev === validImages.length - 1 ? 0 : prev + 1
      );
    }
  };

  const getStockStatusColor = () => {
    if (product.stock === 0) return 'bg-red-100 text-red-800';
    if (product.stock <= product.minStockThreshold) return 'bg-yellow-100 text-yellow-800';
    return 'bg-green-100 text-green-800';
  };

  const getStockStatusText = () => {
    if (product.stock === 0) return 'Out of Stock';
    if (product.stock <= product.minStockThreshold) return 'Low Stock';
    return 'In Stock';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-lg shadow-sm overflow-hidden"
    >
      <div className="relative">
        {validImages.length > 0 ? (
          <>
            <img
              src={validImages[currentImageIndex]}
              alt={product.name}
              className="w-full h-48 object-cover cursor-pointer"
              onClick={nextImage}
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = 'https://via.placeholder.com/400x300?text=No+Image';
              }}
            />
            {validImages.length > 1 && (
              <button
                onClick={nextImage}
                className="absolute bottom-2 right-2 p-1 bg-black bg-opacity-50 rounded-full text-white"
              >
                <FiImage className="w-4 h-4" />
              </button>
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
          <p className="text-sm text-gray-500">{product.category}</p>
        </div>

        <div className="mb-4">
          <p className="text-xl font-semibold text-gray-900">{formatCurrency(product.price)}</p>
          <p className="text-sm text-gray-500">Stock: {product.stock}</p>
          {product.supplier && (
            <p className="text-sm text-gray-500">Supplier: {product.supplier}</p>
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
    </motion.div>
  );
} 