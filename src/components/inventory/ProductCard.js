import { useState } from 'react';
import { motion } from 'framer-motion';
import { FiEdit2, FiTrash2, FiImage } from 'react-icons/fi';
import { deleteProduct } from '../../utils/inventoryQueries';

export default function ProductCard({ product, onEdit, onRefetch }) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        setIsDeleting(true);
        await deleteProduct(product.id, product.images);
        onRefetch();
      } catch (error) {
        console.error('Error deleting product:', error);
        alert('Failed to delete product');
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const nextImage = () => {
    setCurrentImageIndex((prev) =>
      prev === product.images.length - 1 ? 0 : prev + 1
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-lg shadow-sm overflow-hidden"
    >
      <div className="relative">
        {product.images && product.images.length > 0 ? (
          <>
            <img
              src={product.images[currentImageIndex]}
              alt={product.name}
              className="w-full h-48 object-cover"
              onClick={nextImage}
            />
            {product.images.length > 1 && (
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
        {product.stock <= 10 && (
          <div className="absolute top-2 right-2 px-2 py-1 bg-red-500 text-white text-xs rounded-full">
            Low Stock
          </div>
        )}
      </div>

      <div className="p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-1">
          {product.name}
        </h3>
        <p className="text-sm text-gray-500 mb-2">{product.category}</p>
        <div className="flex justify-between items-center mb-2">
          <span className="text-lg font-bold text-primary-600">
            ${product.price}
          </span>
          <span
            className={`text-sm font-medium ${
              product.stock <= 10 ? 'text-red-600' : 'text-gray-600'
            }`}
          >
            Stock: {product.stock}
          </span>
        </div>

        <div className="flex justify-end space-x-2 mt-4">
          <button
            onClick={onEdit}
            className="p-2 text-gray-600 hover:text-primary-600 transition-colors"
          >
            <FiEdit2 className="w-5 h-5" />
          </button>
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="p-2 text-gray-600 hover:text-red-600 transition-colors"
          >
            <FiTrash2 className="w-5 h-5" />
          </button>
        </div>
      </div>
    </motion.div>
  );
} 