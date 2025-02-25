import { db } from '../firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs, query, where, Timestamp } from 'firebase/firestore';
import { logActivity } from './activityLog';

export const getDiscounts = async () => {
  try {
    const discountsRef = collection(db, 'discounts');
    const q = query(discountsRef);
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      validUntil: doc.data().validUntil
    }));
  } catch (error) {
    console.error('Error fetching discounts:', error);
    throw error;
  }
};

export const addDiscount = async (discountData) => {
  try {
    const discountsRef = collection(db, 'discounts');
    const docRef = await addDoc(discountsRef, {
      ...discountData,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });

    await logActivity({
      type: 'discount_created',
      details: `Created discount: ${discountData.name}`,
      metadata: {
        discountId: docRef.id,
        discountName: discountData.name,
        discountType: discountData.type
      }
    });

    return docRef.id;
  } catch (error) {
    console.error('Error adding discount:', error);
    throw error;
  }
};

export const updateDiscount = async (discountId, discountData) => {
  try {
    const discountRef = doc(db, 'discounts', discountId);
    await updateDoc(discountRef, {
      ...discountData,
      updatedAt: Timestamp.now()
    });

    await logActivity({
      type: 'discount_updated',
      details: `Updated discount: ${discountData.name}`,
      metadata: {
        discountId,
        discountName: discountData.name,
        discountType: discountData.type
      }
    });

    return true;
  } catch (error) {
    console.error('Error updating discount:', error);
    throw error;
  }
};

export const deleteDiscount = async (discountId, discountName) => {
  try {
    const discountRef = doc(db, 'discounts', discountId);
    await deleteDoc(discountRef);

    await logActivity({
      type: 'discount_deleted',
      details: `Deleted discount: ${discountName}`,
      metadata: {
        discountId,
        discountName
      }
    });

    return true;
  } catch (error) {
    console.error('Error deleting discount:', error);
    throw error;
  }
};

export const getActiveDiscounts = async () => {
  try {
    const discountsRef = collection(db, 'discounts');
    const now = Timestamp.now();
    
    const q = query(
      discountsRef,
      where('active', '==', true),
      where('validUntil', '>', now)
    );
    
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      validUntil: doc.data().validUntil
    }));
  } catch (error) {
    console.error('Error fetching active discounts:', error);
    throw error;
  }
};

export const calculateDiscount = (subtotal, discount) => {
  if (!discount || !discount.active) return 0;

  const now = Timestamp.now();
  if (discount.validUntil < now) return 0;

  if (subtotal < discount.minPurchase) return 0;

  let discountAmount = 0;
  
  if (discount.type === 'percentage') {
    discountAmount = (subtotal * discount.value) / 100;
    if (discount.maxDiscount > 0) {
      discountAmount = Math.min(discountAmount, discount.maxDiscount);
    }
  } else if (discount.type === 'bogo') {
    // Implementation for Buy One Get One Free logic
    // This would need to be customized based on specific BOGO rules
    discountAmount = 0; // Placeholder - implement actual BOGO logic
  }

  return Math.round(discountAmount * 100) / 100; // Round to 2 decimal places
};

export const getDiscountAnalytics = async (discountId) => {
  try {
    const ordersRef = collection(db, 'orders');
    const now = Timestamp.now();
    const thirtyDaysAgo = new Timestamp(now.seconds - (30 * 24 * 60 * 60), 0);
    
    // Get orders with this discount in the last 30 days
    const q = query(
      ordersRef,
      where('discountId', '==', discountId),
      where('createdAt', '>=', thirtyDaysAgo)
    );
    
    const querySnapshot = await getDocs(q);
    const orders = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Calculate analytics
    const totalSavings = orders.reduce((sum, order) => sum + order.discount, 0);
    const usageCount = orders.length;
    const averageOrderValue = usageCount > 0
      ? orders.reduce((sum, order) => sum + order.total, 0) / usageCount
      : 0;

    // Get total orders in the same period for conversion rate
    const totalOrdersQuery = query(
      ordersRef,
      where('createdAt', '>=', thirtyDaysAgo)
    );
    const totalOrdersSnapshot = await getDocs(totalOrdersQuery);
    const totalOrders = totalOrdersSnapshot.docs.length;
    const conversionRate = totalOrders > 0 ? usageCount / totalOrders : 0;

    return {
      totalSavings,
      usageCount,
      averageOrderValue,
      conversionRate
    };
  } catch (error) {
    console.error('Error getting discount analytics:', error);
    throw error;
  }
};

export const getDiscountUsageHistory = async (discountId) => {
  try {
    const ordersRef = collection(db, 'orders');
    const q = query(
      ordersRef,
      where('discountId', '==', discountId),
      where('createdAt', '>=', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt.toDate()
    }));
  } catch (error) {
    console.error('Error getting discount usage history:', error);
    throw error;
  }
};

export const getDiscountPerformanceMetrics = async (discountId) => {
  try {
    const analytics = await getDiscountAnalytics(discountId);
    const usageHistory = await getDiscountUsageHistory(discountId);
    
    // Calculate daily metrics
    const dailyMetrics = {};
    usageHistory.forEach(order => {
      const date = order.createdAt.toISOString().split('T')[0];
      if (!dailyMetrics[date]) {
        dailyMetrics[date] = {
          savings: 0,
          orders: 0,
          revenue: 0
        };
      }
      dailyMetrics[date].savings += order.discount;
      dailyMetrics[date].orders += 1;
      dailyMetrics[date].revenue += order.total;
    });

    return {
      overview: analytics,
      dailyMetrics: Object.entries(dailyMetrics).map(([date, metrics]) => ({
        date,
        ...metrics
      }))
    };
  } catch (error) {
    console.error('Error getting discount performance metrics:', error);
    throw error;
  }
};