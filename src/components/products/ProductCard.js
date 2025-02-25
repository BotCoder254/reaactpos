import React, { useState } from 'react';
import { doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../contexts/AuthContext';
import { formatCurrency } from '../../utils/cartUtils';

function ProductCard({ product, onUpdate }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedProduct, setEditedProduct] = useState(product);
  const { currentUser } = useAuth();

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

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      {product.imageUrl && (
        <img
          src={product.imageUrl}
          alt={product.name}
          className="w-full h-48 object-cover"
        />
      )}
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