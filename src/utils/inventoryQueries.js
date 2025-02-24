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
  arrayRemove
} from 'firebase/firestore';
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from 'firebase/storage';

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
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return docRef.id;
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
      updatedAt: new Date(),
    });
  } catch (error) {
    console.error('Error updating product:', error);
    throw error;
  }
}

// Delete a product
export async function deleteProduct(productId, imageUrls = []) {
  try {
    // Delete images from storage
    await Promise.all(
      imageUrls.map(async (url) => {
        const storageRef = ref(storage, url);
        try {
          await deleteObject(storageRef);
        } catch (error) {
          console.error('Error deleting image:', error);
        }
      })
    );

    // Delete product document
    await deleteDoc(doc(db, 'products', productId));
  } catch (error) {
    console.error('Error deleting product:', error);
    throw error;
  }
}

// Get all products
export async function getProducts() {
  try {
    const q = query(
      collection(db, 'products'),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting products:', error);
    throw error;
  }
}

// Get low stock products
export async function getLowStockProducts(threshold = 10) {
  try {
    const q = query(
      collection(db, 'products'),
      where('stock', '<=', threshold),
      orderBy('stock', 'asc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting low stock products:', error);
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