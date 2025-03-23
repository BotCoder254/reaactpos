import { db, storage } from '../config/firebase';
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
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
import toast from 'react-hot-toast';

const uploadImage = async (file, productId) => {
  try {
    // Create a unique filename to prevent collisions
    const uniqueFileName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
    const storageRef = ref(storage, `products/${productId}/${uniqueFileName}`);
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    return downloadURL;
  } catch (error) {
    console.error('Error uploading image:', error);
    throw error;
  }
};

const ensureImageURLs = async (urls = []) => {
  try {
    return await Promise.all(
      urls.map(async (url) => {
        if (!url) return null;
        try {
          // If URL is already a full URL, return it
          if (url.startsWith('http')) return url;
          // Otherwise, try to get the download URL
          const storageRef = ref(storage, url);
          return await getDownloadURL(storageRef);
        } catch (error) {
          console.error('Error getting image URL:', error);
          return null;
        }
      })
    ).then(urls => urls.filter(url => url !== null));
  } catch (error) {
    console.error('Error ensuring image URLs:', error);
    return [];
  }
};

// Add a new product
export async function addProduct(productData, images = []) {
  try {
    // First create the product document without images
    const productsRef = collection(db, 'products');
    const docRef = await addDoc(productsRef, {
      ...productData,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      images: [] // Initialize with empty array
    });

    // Then upload images if any
    const imageUrls = [];
    if (images && images.length > 0) {
      for (const image of images) {
        const imageUrl = await uploadImage(image, docRef.id);
        if (imageUrl) imageUrls.push(imageUrl);
      }

      // Update the product with image URLs
      if (imageUrls.length > 0) {
        await updateDoc(docRef, { images: imageUrls });
      }
    }

    await logActivity({
      type: 'product_created',
      details: `Created product: ${productData.name}`,
      metadata: {
        productId: docRef.id,
        productName: productData.name
      }
    });

    return {
      id: docRef.id,
      ...productData,
      images: imageUrls
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
    const productSnap = await getDoc(productRef);
    
    if (!productSnap.exists()) {
      throw new Error('Product not found');
    }

    // Get existing product data
    const existingData = productSnap.data();
    const existingImages = await ensureImageURLs(existingData.images || []);
    
    // Upload new images if any
    const newImageUrls = [];
    if (newImages && newImages.length > 0) {
      for (const image of newImages) {
        const imageUrl = await uploadImage(image, productId);
        if (imageUrl) newImageUrls.push(imageUrl);
      }
    }

    // Combine existing and new image URLs
    const updatedImages = [...existingImages, ...newImageUrls];

    // Update the product with all data including images
    const updateData = {
      ...productData,
      images: updatedImages,
      updatedAt: Timestamp.now()
    };

    await updateDoc(productRef, updateData);

    await logActivity({
      type: 'product_updated',
      details: `Updated product: ${productData.name}`,
      metadata: {
        productId,
        productName: productData.name
      }
    });

    return {
      id: productId,
      ...updateData
    };
  } catch (error) {
    console.error('Error updating product:', error);
    throw error;
  }
}

// Delete a product
export async function deleteProduct(productId, productName) {
  try {
    // Delete all images from storage first
    const productRef = doc(db, 'products', productId);
    const productSnapshot = await getDocs(query(collection(db, 'products'), where('id', '==', productId)));
    const product = productSnapshot.docs[0]?.data();
    
    if (product?.images && Array.isArray(product.images)) {
      for (const imageUrl of product.images) {
        try {
          const imageRef = ref(storage, imageUrl);
          await deleteObject(imageRef);
        } catch (error) {
          console.error('Error deleting image:', error);
          // Continue with other images even if one fails
        }
      }
    }

    // Then delete the product document
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

    // Apply filters if any
    if (filters.category) {
      q = query(q, where('category', '==', filters.category));
    }
    if (filters.minStock !== undefined) {
      q = query(q, where('stock', '>=', filters.minStock));
    }
    if (filters.maxStock !== undefined) {
      q = query(q, where('stock', '<=', filters.maxStock));
    }

    const querySnapshot = await getDocs(q);
    const products = await Promise.all(
      querySnapshot.docs.map(async (doc) => {
        const data = doc.data();
        // Ensure all image URLs are valid and accessible
        const validatedImages = await ensureImageURLs(data.images);
        return {
          id: doc.id,
          ...data,
          images: validatedImages
        };
      })
    );

    return products;
  } catch (error) {
    console.error('Error fetching products:', error);
    throw error;
  }
}

// Get low stock products
export async function getLowStockProducts(threshold = 10) {
  try {
    const productsRef = collection(db, 'products');
    const q = query(productsRef, where('stock', '<=', threshold));
    const querySnapshot = await getDocs(q);
    
    const products = await Promise.all(
      querySnapshot.docs.map(async (doc) => {
        const data = doc.data();
        const validatedImages = await ensureImageURLs(data.images);
        return {
          id: doc.id,
          ...data,
          images: validatedImages
        };
      })
    );

    return products;
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
    const imageRef = ref(storage, imageUrl);
    await deleteObject(imageRef);

    // Update product document to remove the image URL
    const productRef = doc(db, 'products', productId);
    const productSnapshot = await getDocs(query(collection(db, 'products'), where('id', '==', productId)));
    const product = productSnapshot.docs[0]?.data();
    
    if (product?.images) {
      const updatedImages = product.images.filter(url => url !== imageUrl);
      await updateDoc(productRef, { 
        images: updatedImages,
        updatedAt: Timestamp.now()
      });
    }

    await logActivity({
      type: 'product_image_deleted',
      details: `Deleted image from product: ${productId}`,
      metadata: {
        productId,
        imageUrl
      }
    });

    return true;
  } catch (error) {
    console.error('Error deleting product image:', error);
    throw error;
  }
}

export const updateStock = async (productId, quantity, type = 'add') => {
  try {
    const productRef = doc(db, 'products', productId);
    const productSnapshot = await getDocs(query(collection(db, 'products'), where('id', '==', productId)));
    const product = productSnapshot.docs[0]?.data();
    
    if (!product) {
      throw new Error('Product not found');
    }

    const currentStock = product.stock || 0;
    const newStock = type === 'add' ? currentStock + quantity : currentStock - quantity;

    if (newStock < 0) {
      throw new Error('Insufficient stock');
    }

    await updateDoc(productRef, {
      stock: newStock,
      updatedAt: Timestamp.now()
    });

    await logActivity({
      type: 'stock_updated',
      details: `${type === 'add' ? 'Added' : 'Removed'} ${quantity} units from product: ${product.name}`,
      metadata: {
        productId,
        quantity,
        type,
        newStock
      }
    });

    return newStock;
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