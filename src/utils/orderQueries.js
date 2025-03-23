import { collection, addDoc, updateDoc, doc, getDoc, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { logActivity } from './activityLog';

export const createOrder = async (orderData) => {
  try {
    const ordersRef = collection(db, 'orders');
    const orderDoc = await addDoc(ordersRef, {
      ...orderData,
      status: 'pending',
      createdAt: new Date()
    });

    await logActivity({
      type: 'order',
      action: 'created',
      details: `Order created with ID: ${orderDoc.id}`,
      orderId: orderDoc.id
    });

    return {
      success: true,
      orderId: orderDoc.id
    };
  } catch (error) {
    console.error('Error creating order:', error);
    throw new Error('Failed to create order');
  }
};

export const updateOrderStatus = async (orderId, status) => {
  try {
    const orderRef = doc(db, 'orders', orderId);
    await updateDoc(orderRef, {
      status: status,
      updatedAt: new Date()
    });

    await logActivity({
      type: 'order',
      action: 'updated',
      details: `Order ${orderId} status updated to ${status}`,
      orderId: orderId
    });

    return { success: true };
  } catch (error) {
    console.error('Error updating order:', error);
    throw new Error('Failed to update order');
  }
};

export const getOrder = async (orderId) => {
  try {
    const orderRef = doc(db, 'orders', orderId);
    const orderSnap = await getDoc(orderRef);
    
    if (!orderSnap.exists()) {
      throw new Error('Order not found');
    }

    return {
      id: orderSnap.id,
      ...orderSnap.data()
    };
  } catch (error) {
    console.error('Error fetching order:', error);
    throw new Error('Failed to fetch order');
  }
};

export const getOrders = async () => {
  try {
    const ordersRef = collection(db, 'orders');
    const q = query(ordersRef, orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      customerName: doc.data().customerName || 'Unknown Customer',
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate()
    }));
  } catch (error) {
    console.error('Error fetching orders:', error);
    throw error;
  }
}; 