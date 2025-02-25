import React, { useState } from 'react';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../../firebase';

function AddProductModal({ isOpen, onClose, onProductAdded }) {
  const [product, setProduct] = useState({
    name: '',
    price: '',
    description: '',
    stock: '',
    imageUrl: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const productsRef = collection(db, 'products');
      await addDoc(productsRef, {
        ...product,
        price: Number(product.price),
        stock: Number(product.stock),
        createdAt: new Date()
      });
      onProductAdded();
      onClose();
      setProduct({ name: '', price: '', description: '', stock: '', imageUrl: '' });
    } catch (error) {
      console.error('Error adding product:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Add New Product</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
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
              <label className="block text-sm font-medium text-gray-700">Description</label>
              <textarea
                value={product.description}
                onChange={(e) => setProduct({ ...product, description: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                rows="3"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Image URL</label>
              <input
                type="url"
                value={product.imageUrl}
                onChange={(e) => setProduct({ ...product, imageUrl: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
              />
            </div>
            <div className="flex justify-end space-x-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Add Product
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default AddProductModal; 