import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import {
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
} from 'firebase/firestore';
import { db } from '../firebase';
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
        const productsRef = collection(db, 'products');
        const querySnapshot = await getDocs(productsRef);
        const fetchedProducts = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        setProducts(fetchedProducts);

        // Only fetch low stock products for managers
        if (userRole === 'manager') {
          const lowStock = fetchedProducts.filter(
            product => product.stock <= (product.minStockThreshold || 10)
          );
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

  const addProduct = async (productData) => {
    try {
      setError(null);
      const productsRef = collection(db, 'products');
      const docRef = await addDoc(productsRef, {
        ...productData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      
      const newProduct = {
        id: docRef.id,
        ...productData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      setProducts(prev => [...prev, newProduct]);
      toast.success('Product added successfully');
      return newProduct;
    } catch (err) {
      setError('Failed to add product');
      toast.error('Failed to add product');
      throw err;
    }
  };

  const updateProduct = async (productId, productData) => {
    try {
      setError(null);
      const productRef = doc(db, 'products', productId);
      const updatedData = {
        ...productData,
        updatedAt: new Date().toISOString(),
      };
      
      await updateDoc(productRef, updatedData);
      
      setProducts(prev =>
        prev.map(product =>
          product.id === productId
            ? { ...product, ...updatedData }
            : product
        )
      );
      
      toast.success('Product updated successfully');
    } catch (err) {
      setError('Failed to update product');
      toast.error('Failed to update product');
      throw err;
    }
  };

  const deleteProduct = async (productId, productName) => {
    try {
      setError(null);
      const productRef = doc(db, 'products', productId);
      await deleteDoc(productRef);
      setProducts(prev => prev.filter(product => product.id !== productId));
      toast.success(`${productName} deleted successfully`);
    } catch (err) {
      setError('Failed to delete product');
      toast.error('Failed to delete product');
      throw err;
    }
  };

  const deleteProductImage = async (productId, imageData) => {
    try {
      setError(null);
      const productRef = doc(db, 'products', productId);
      const product = products.find(p => p.id === productId);
      
      if (!product) throw new Error('Product not found');
      
      const updatedImages = product.images.filter(img => 
        img.unsplashId !== imageData.unsplashId
      );
      
      await updateDoc(productRef, {
        images: updatedImages,
        updatedAt: new Date().toISOString(),
      });
      
      setProducts(prev =>
        prev.map(p =>
          p.id === productId
            ? { ...p, images: updatedImages }
            : p
        )
      );
      
      toast.success('Image removed successfully');
    } catch (err) {
      setError('Failed to delete image');
      toast.error('Failed to delete image');
      throw err;
    }
  };

  const updateStock = async (productId, quantity, type = 'add') => {
    try {
      setError(null);
      const productRef = doc(db, 'products', productId);
      const product = products.find(p => p.id === productId);
      
      if (!product) throw new Error('Product not found');
      
      const newStock = type === 'add'
        ? product.stock + quantity
        : Math.max(0, product.stock - quantity);
      
      await updateDoc(productRef, {
        stock: newStock,
        updatedAt: new Date().toISOString(),
      });
      
      setProducts(prev =>
        prev.map(p =>
          p.id === productId
            ? { ...p, stock: newStock }
            : p
        )
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

      // Find products in the same category with stock available
      const alternatives = products.filter(p => 
        p.id !== productId && 
        p.category === product.category && 
        p.stock > 0
      );

      // Sort by price similarity
      alternatives.sort((a, b) => {
        const priceDiffA = Math.abs(a.price - product.price);
        const priceDiffB = Math.abs(b.price - product.price);
        return priceDiffA - priceDiffB;
      });

      return alternatives.slice(0, 5); // Return top 5 alternatives
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
    addProduct,
    updateProduct,
    deleteProduct,
    deleteProductImage,
    updateStock,
    checkLowStock,
    findAlternatives
  };

  return (
    <InventoryContext.Provider value={value}>
      {children}
    </InventoryContext.Provider>
  );
} 