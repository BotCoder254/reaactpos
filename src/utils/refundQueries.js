import { db } from '../firebase';
import { collection, addDoc, updateDoc, getDoc, getDocs, query, where, doc, orderBy, Timestamp } from 'firebase/firestore';
import { logActivity } from './activityLog';

export const createRefundRequest = async (refundData) => {
  try {
    // Clean and validate data before sending to Firestore
    const cleanData = {
      orderId: refundData.orderId?.trim() || '',
      amount: parseFloat(refundData.amount) || 0,
      reason: refundData.reason?.trim() || '',
      productId: refundData.productId || '',
      productName: refundData.productName || '',
      productSKU: refundData.productSKU || '',
      cashierId: refundData.cashierId || '',
      cashierName: refundData.cashierName || 'Unknown Cashier',
      status: refundData.status || 'pending',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    };

    // Only add receipt if it exists
    if (refundData.receipt) {
      cleanData.receipt = refundData.receipt;
    }

    const refundsRef = collection(db, 'refunds');
    const docRef = await addDoc(refundsRef, cleanData);

    await logActivity({
      type: 'refund_request_created',
      details: `Created refund request for order ${cleanData.orderId}`,
      metadata: {
        refundId: docRef.id,
        orderId: cleanData.orderId,
        amount: cleanData.amount
      }
    });

    return {
      id: docRef.id,
      ...cleanData
    };
  } catch (error) {
    console.error('Error creating refund request:', error);
    throw new Error('Failed to create refund request. Please try again.');
  }
};

export const updateRefundStatus = async (refundId, status, notes = '') => {
  try {
    const refundRef = doc(db, 'refunds', refundId);
    const refundDoc = await getDoc(refundRef);
    const refundData = refundDoc.data();

    await updateDoc(refundRef, {
      status,
      notes,
      updatedAt: Timestamp.now()
    });

    await logActivity({
      type: 'refund_status_updated',
      details: `Updated refund status to ${status} for order ${refundData.orderId}`,
      metadata: {
        refundId,
        orderId: refundData.orderId,
        status,
        notes
      }
    });

    return {
      id: refundId,
      ...refundData,
      status,
      notes
    };
  } catch (error) {
    console.error('Error updating refund status:', error);
    throw error;
  }
};

export const getRefundRequests = async (cashierId = null) => {
  try {
    const refundsRef = collection(db, 'refunds');
    let q = query(refundsRef, orderBy('createdAt', 'desc'));

    if (cashierId) {
      q = query(q, where('cashierId', '==', cashierId));
    }

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate(),
      updatedAt: doc.data().updatedAt?.toDate()
    }));
  } catch (error) {
    console.error('Error fetching refund requests:', error);
    throw error;
  }
};

export const getRefundById = async (refundId) => {
  try {
    const refundRef = doc(db, 'refunds', refundId);
    const refundDoc = await getDoc(refundRef);

    if (!refundDoc.exists()) {
      throw new Error('Refund not found');
    }

    return {
      id: refundDoc.id,
      ...refundDoc.data(),
      createdAt: refundDoc.data().createdAt?.toDate(),
      updatedAt: refundDoc.data().updatedAt?.toDate()
    };
  } catch (error) {
    console.error('Error fetching refund:', error);
    throw error;
  }
};

export const getRefundAnalytics = async (startDate, endDate) => {
  try {
    const refundsRef = collection(db, 'refunds');
    const q = query(
      refundsRef,
      where('createdAt', '>=', startDate),
      where('createdAt', '<=', endDate)
    );

    const querySnapshot = await getDocs(q);
    const refunds = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    const totalRefunds = refunds.length;
    const totalAmount = refunds.reduce((sum, refund) => sum + refund.amount, 0);
    const approvedRefunds = refunds.filter(r => r.status === 'approved').length;
    const rejectedRefunds = refunds.filter(r => r.status === 'rejected').length;

    return {
      totalRefunds,
      totalAmount,
      approvedRefunds,
      rejectedRefunds,
      refundsByStatus: {
        pending: refunds.filter(r => r.status === 'pending').length,
        approved: approvedRefunds,
        rejected: rejectedRefunds
      }
    };
  } catch (error) {
    console.error('Error getting refund analytics:', error);
    throw error;
  }
}; 