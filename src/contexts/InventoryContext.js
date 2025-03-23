import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import {
  getProducts,
  addProduct,
  updateProduct,
  deleteProduct,
  updateStock,
  getLowStockProducts,
  getAlternativeProducts
} from '../utils/inventoryQueries';
import toast from 'react-hot-toast';

const InventoryContext = createContext();

export function useInventory() {
  return useContext(InventoryContext);
}

export function InventoryProvider({ children }) {
  const [products, setProducts] = useState([]);
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { currentUser, userRole } = useAuth();

  useEffect(() => {
    if (!currentUser) {
      setLoading(false);
      return;
    }

    const fetchProducts = async () => {
      try {
        setLoading(true);
        const fetchedProducts = await getProducts();
        setProducts(fetchedProducts);

        // Only fetch low stock products for managers
        if (userRole === 'manager') {
          const lowStock = await getLowStockProducts();
          setLowStockProducts(lowStock);
        }

        setError(null);
      } catch (err) {
        console.error('Error fetching products:', err);
        setError('Failed to load products');
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [currentUser, userRole]);

  const addNewProduct = async (productData) => {
    try {
      setError(null);
      const newProduct = await addProduct(productData);
      setProducts(prev => [...prev, newProduct]);
      toast.success('Product added successfully');
      return newProduct;
    } catch (err) {
      setError('Failed to add product');
      toast.error('Failed to add product');
      throw err;
    }
  };

  const updateExistingProduct = async (productId, productData) => {
    try {
      setError(null);
      await updateProduct(productId, productData);
      setProducts(prev =>
        prev.map(product =>
          product.id === productId ? { ...product, ...productData } : product
        )
      );
      toast.success('Product updated successfully');
    } catch (err) {
      setError('Failed to update product');
      toast.error('Failed to update product');
      throw err;
    }
  };

  const removeProduct = async (productId, productName) => {
    try {
      setError(null);
      await deleteProduct(productId, productName);
      setProducts(prev => prev.filter(product => product.id !== productId));
      toast.success('Product deleted successfully');
    } catch (err) {
      setError('Failed to delete product');
      toast.error('Failed to delete product');
      throw err;
    }
  };

  const updateProductStock = async (productId, quantity, type = 'add') => {
    try {
      setError(null);
      await updateStock(productId, quantity, type);
      setProducts(prev =>
        prev.map(product => {
          if (product.id === productId) {
            const newStock = type === 'add'
              ? product.stock + quantity
              : Math.max(0, product.stock - quantity);
            return { ...product, stock: newStock };
          }
          return product;
        })
      );
      toast.success('Stock updated successfully');
    } catch (err) {
      setError('Failed to update stock');
      toast.error('Failed to update stock');
      throw err;
    }
  };

  const checkLowStock = async (productId) => {
    const product = products.find(p => p.id === productId);
    if (!product) return false;

    const isLowStock = product.stock <= product.minStockThreshold;
    if (isLowStock) {
      toast.warning(`Low stock alert: ${product.name} (${product.stock} remaining)`);
    }
    return isLowStock;
  };

  const findAlternatives = async (productId) => {
    try {
      const product = products.find(p => p.id === productId);
      if (!product) return [];

      const alternatives = await getAlternativeProducts(productId, product.category);
      return alternatives;
    } catch (err) {
      console.error('Error finding alternatives:', err);
      return [];
    }
  };

  const value = {
    products,
    lowStockProducts,
    loading,
    error,
    addProduct: addNewProduct,
    updateProduct: updateExistingProduct,
    deleteProduct: removeProduct,
    updateStock: updateProductStock,
    checkLowStock,
    findAlternatives
  };

  return (
    <InventoryContext.Provider value={value}>
      {children}
    </InventoryContext.Provider>
  );
} 