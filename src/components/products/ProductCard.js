import React, { useState, useEffect } from 'react';
import { doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../contexts/AuthContext';
import { formatCurrency } from '../../utils/cartUtils';
import { FiImage } from 'react-icons/fi';

function ProductCard({ product, onUpdate }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedProduct, setEditedProduct] = useState(product);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [validImages, setValidImages] = useState([]);
  const { currentUser } = useAuth();

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
        .map(image => typeof image === 'string' ? image : image.url);

      setValidImages(validUrls);
    };

    validateImages();
  }, [product.images]);

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await deleteDoc(doc(db, 'products', product.id));
        onUpdate();
      } catch (error) {
        console.error('Error deleting product:', error);
      }
    }
  };

  const handleEdit = async () => {
    if (isEditing) {
      try {
        await updateDoc(doc(db, 'products', product.id), {
          name: editedProduct.name,
          price: Number(editedProduct.price),
          description: editedProduct.description,
          stock: Number(editedProduct.stock)
        });
        onUpdate();
      } catch (error) {
        console.error('Error updating product:', error);
      }
    }
    setIsEditing(!isEditing);
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

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="relative">
        {validImages.length > 0 ? (
          <>
            <img
              src={validImages[currentImageIndex]}
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
          </>
        ) : (
          <div className="w-full h-48 bg-gray-100 flex items-center justify-center">
            <FiImage className="w-8 h-8 text-gray-400" />
          </div>
        )}
        {product.stock <= (product.minStockThreshold || 10) && (
          <div className="absolute top-2 right-2 px-2 py-1 bg-red-500 text-white text-xs rounded-full">
            Low Stock
          </div>
        )}
      </div>
      <div className="p-4">
        {isEditing ? (
          <div className="space-y-3">
            <input
              type="text"
              value={editedProduct.name}
              onChange={(e) => setEditedProduct({ ...editedProduct, name: e.target.value })}
              className="w-full p-2 border rounded"
            />
            <input
              type="number"
              value={editedProduct.price}
              onChange={(e) => setEditedProduct({ ...editedProduct, price: e.target.value })}
              className="w-full p-2 border rounded"
            />
            <input
              type="number"
              value={editedProduct.stock}
              onChange={(e) => setEditedProduct({ ...editedProduct, stock: e.target.value })}
              className="w-full p-2 border rounded"
            />
            <textarea
              value={editedProduct.description}
              onChange={(e) => setEditedProduct({ ...editedProduct, description: e.target.value })}
              className="w-full p-2 border rounded"
            />
          </div>
        ) : (
          <>
            <h3 className="text-lg font-medium text-gray-900">{product.name}</h3>
            <p className="mt-1 text-gray-500">{product.description}</p>
            <p className="mt-2 text-xl font-semibold text-gray-900">{formatCurrency(product.price)}</p>
            <p className="mt-1 text-sm text-gray-500">Stock: {product.stock}</p>
            {product.category && (
              <p className="mt-1 text-sm text-gray-500">Category: {product.category}</p>
            )}
            {product.supplier && (
              <p className="mt-1 text-sm text-gray-500">Supplier: {product.supplier}</p>
            )}
          </>
        )}

        {currentUser && currentUser.role === 'admin' && (
          <div className="mt-4 flex justify-end space-x-2">
            <button
              onClick={handleEdit}
              className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              {isEditing ? 'Save' : 'Edit'}
            </button>
            <button
              onClick={handleDelete}
              className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Delete
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default ProductCard; 