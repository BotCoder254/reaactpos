import { db, storage } from '../config/firebase';
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  query,
  where,
  orderBy,
  arrayRemove,
  Timestamp
} from 'firebase/firestore';
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from 'firebase/storage';
import { logActivity } from './activityLog';

// Add a new product
export async function addProduct(productData, images) {
  try {
    // Upload images first
    const imageUrls = await Promise.all(
      images.map(async (image) => {
        const storageRef = ref(storage, `products/${Date.now()}_${image.name}`);
        await uploadBytes(storageRef, image);
        return getDownloadURL(storageRef);
      })
    );

    // Add product to Firestore with image URLs
    const docRef = await addDoc(collection(db, 'products'), {
      ...productData,
      images: imageUrls,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });

    await logActivity({
      type: 'product_created',
      details: `Added product: ${productData.name}`,
      metadata: {
        productId: docRef.id,
        productName: productData.name,
        category: productData.category
      }
    });

    return {
      id: docRef.id,
      ...productData
    };
  } catch (error) {
    console.error('Error adding product:', error);
    throw error;
  }
}

// Update a product
export async function updateProduct(productId, productData, newImages = []) {
  try {
    const productRef = doc(db, 'products', productId);
    
    // Upload new images if any
    const newImageUrls = await Promise.all(
      newImages.map(async (image) => {
        const storageRef = ref(storage, `products/${Date.now()}_${image.name}`);
        await uploadBytes(storageRef, image);
        return getDownloadURL(storageRef);
      })
    );

    // Update product with new data and append new image URLs
    await updateDoc(productRef, {
      ...productData,
      ...(newImageUrls.length > 0 && {
        images: [...(productData.images || []), ...newImageUrls],
      }),
      updatedAt: Timestamp.now()
    });

    await logActivity({
      type: 'product_updated',
      details: `Updated product: ${productData.name}`,
      metadata: {
        productId,
        productName: productData.name,
        changes: Object.keys(productData)
      }
    });

    return true;
  } catch (error) {
    console.error('Error updating product:', error);
    throw error;
  }
}

// Delete a product
export async function deleteProduct(productId, productName) {
  try {
    // Delete product document
    const productRef = doc(db, 'products', productId);
    await deleteDoc(productRef);

    await logActivity({
      type: 'product_deleted',
      details: `Deleted product: ${productName}`,
      metadata: {
        productId,
        productName
      }
    });

    return true;
  } catch (error) {
    console.error('Error deleting product:', error);
    throw error;
  }
}

// Get all products
export async function getProducts(filters = {}) {
  try {
    const productsRef = collection(db, 'products');
    let q = query(productsRef);

    if (filters.category) {
      q = query(q, where('category', '==', filters.category));
    }

    if (filters.supplier) {
      q = query(q, where('supplier', '==', filters.supplier));
    }

    if (filters.stockStatus) {
      switch (filters.stockStatus) {
        case 'low':
          q = query(q, where('stock', '<=', 'minStockThreshold'));
          break;
        case 'out':
          q = query(q, where('stock', '==', 0));
          break;
        case 'available':
          q = query(q, where('stock', '>', 0));
          break;
      }
    }

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      price: Number(doc.data().price),
      stock: Number(doc.data().stock),
      minStockThreshold: Number(doc.data().minStockThreshold || 10)
    }));
  } catch (error) {
    console.error('Error fetching products:', error);
    throw error;
  }
}

// Get low stock products
export async function getLowStockProducts(threshold = 10) {
  try {
    const productsRef = collection(db, 'products');
    const q = query(
      productsRef,
      where('stock', '<=', threshold)
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error fetching low stock products:', error);
    throw error;
  }
}

// Import products from CSV
export async function importProductsFromCSV(csvData) {
  try {
    const batch = [];
    for (const product of csvData) {
      batch.push(
        addDoc(collection(db, 'products'), {
          ...product,
          stock: parseInt(product.stock),
          price: parseFloat(product.price),
          createdAt: new Date(),
          updatedAt: new Date(),
        })
      );
    }
    await Promise.all(batch);
  } catch (error) {
    console.error('Error importing products:', error);
    throw error;
  }
}

// Delete image from product
export async function deleteProductImage(productId, imageUrl) {
  try {
    // Delete image from storage
    const storageRef = ref(storage, imageUrl);
    await deleteObject(storageRef);

    // Update product document to remove image URL
    const productRef = doc(db, 'products', productId);
    await updateDoc(productRef, {
      images: arrayRemove(imageUrl),
      updatedAt: new Date(),
    });
  } catch (error) {
    console.error('Error deleting product image:', error);
    throw error;
  }
}

export const updateStock = async (productId, quantity, type = 'add') => {
  try {
    const productRef = doc(db, 'products', productId);
    const productDoc = await getDocs(productRef);
    const currentStock = productDoc.data().stock;

    const newStock = type === 'add' 
      ? currentStock + quantity 
      : currentStock - quantity;

    await updateDoc(productRef, {
      stock: Math.max(0, newStock),
      updatedAt: Timestamp.now()
    });

    await logActivity({
      type: 'stock_updated',
      details: `${type === 'add' ? 'Added' : 'Removed'} ${quantity} units to product ${productId}`,
      metadata: {
        productId,
        quantity,
        type,
        newStock
      }
    });

    return true;
  } catch (error) {
    console.error('Error updating stock:', error);
    throw error;
  }
};

export const getAlternativeProducts = async (productId, category) => {
  try {
    const productsRef = collection(db, 'products');
    const q = query(
      productsRef,
      where('category', '==', category),
      where('stock', '>', 0)
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs
      .map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      .filter(product => product.id !== productId);
  } catch (error) {
    console.error('Error fetching alternative products:', error);
    throw error;
  }
};