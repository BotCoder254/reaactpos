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
    
    // First get all orders with this discount
    const discountQuery = query(
      ordersRef,
      where('discountId', '==', discountId)
    );
    
    const querySnapshot = await getDocs(discountQuery);
    const orders = querySnapshot.docs
      .map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      .filter(order => order.createdAt >= thirtyDaysAgo); // Filter in memory

    // Calculate analytics
    const totalSavings = orders.reduce((sum, order) => sum + (order.discount || 0), 0);
    const usageCount = orders.length;
    const averageOrderValue = usageCount > 0
      ? orders.reduce((sum, order) => sum + order.total, 0) / usageCount
      : 0;

    // Get total orders in the same period for conversion rate
    const allOrdersQuery = query(ordersRef);
    const allOrdersSnapshot = await getDocs(allOrdersQuery);
    const totalOrders = allOrdersSnapshot.docs
      .filter(doc => doc.data().createdAt >= thirtyDaysAgo)
      .length;
    
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
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    // Query only by discountId
    const q = query(
      ordersRef,
      where('discountId', '==', discountId)
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs
      .map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt.toDate()
      }))
      .filter(order => order.createdAt >= thirtyDaysAgo) // Filter in memory
      .sort((a, b) => b.createdAt - a.createdAt); // Sort in memory
  } catch (error) {
    console.error('Error getting discount usage history:', error);
    throw error;
  }
};

export const getDiscountPerformanceMetrics = async (discountId) => {
  try {
    const analytics = await getDiscountAnalytics(discountId);
    const usageHistory = await getDiscountUsageHistory(discountId);
    
    // Calculate daily metrics from the filtered usage history
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
      dailyMetrics[date].savings += order.discount || 0;
      dailyMetrics[date].orders += 1;
      dailyMetrics[date].revenue += order.total || 0;
    });

    // Sort dates and ensure we have entries for all days
    const sortedDates = Object.keys(dailyMetrics).sort();
    if (sortedDates.length > 0) {
      const firstDate = new Date(sortedDates[0]);
      const lastDate = new Date(sortedDates[sortedDates.length - 1]);
      
      for (let d = new Date(firstDate); d <= lastDate; d.setDate(d.getDate() + 1)) {
        const date = d.toISOString().split('T')[0];
        if (!dailyMetrics[date]) {
          dailyMetrics[date] = {
            savings: 0,
            orders: 0,
            revenue: 0
          };
        }
      }
    }

    return {
      overview: analytics,
      dailyMetrics: Object.entries(dailyMetrics)
        .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
        .map(([date, metrics]) => ({
          date,
          ...metrics
        }))
    };
  } catch (error) {
    console.error('Error getting discount performance metrics:', error);
    throw error;
  }
};