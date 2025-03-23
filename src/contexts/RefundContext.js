import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { 
  createRefundRequest, 
  getRefundRequests, 
  updateRefundStatus,
  getRefundById
} from '../utils/refundQueries';

const RefundContext = createContext();

export function useRefund() {
  return useContext(RefundContext);
}

export function RefundProvider({ children }) {
  const [refundRequests, setRefundRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { currentUser, userRole } = useAuth();

  useEffect(() => {
    if (!currentUser) {
      setLoading(false);
      return;
    }

    const fetchRefunds = async () => {
      try {
        setLoading(true);
        const requests = await getRefundRequests(userRole === 'cashier' ? currentUser.uid : null);
        setRefundRequests(requests);
        setError(null);
      } catch (err) {
        console.error('Error fetching refund requests:', err);
        setError('Failed to load refund requests');
      } finally {
        setLoading(false);
      }
    };

    fetchRefunds();
  }, [currentUser, userRole]);

  const initiateRefund = async (refundData) => {
    if (!currentUser) {
      throw new Error('User must be logged in to initiate refund');
    }

    try {
      setError(null);
      // Clean and validate data
      const cleanedData = {
        ...refundData,
        cashierId: currentUser.uid,
        cashierName: currentUser.displayName || currentUser.email || 'Unknown Cashier',
        status: 'pending',
        createdAt: new Date(),
        // Ensure all required fields have values
        orderId: refundData.orderId?.trim() || '',
        amount: parseFloat(refundData.amount) || 0,
        reason: refundData.reason?.trim() || '',
        productId: refundData.productId || '',
        productName: refundData.productName || '',
        productSKU: refundData.productSKU || ''
      };

      // Validate the cleaned data
      if (!cleanedData.orderId || !cleanedData.amount || !cleanedData.reason) {
        throw new Error('Missing required fields');
      }

      if (cleanedData.amount <= 0) {
        throw new Error('Refund amount must be greater than 0');
      }

      const newRefund = await createRefundRequest(cleanedData);
      setRefundRequests(prev => [...prev, newRefund]);
      return newRefund;
    } catch (err) {
      console.error('Error creating refund request:', err);
      setError(err.message || 'Failed to create refund request');
      throw err;
    }
  };

  const handleRefundAction = async (refundId, action, notes = '') => {
    if (!currentUser || userRole !== 'manager') {
      throw new Error('Only managers can approve or reject refunds');
    }

    try {
      setError(null);
      const updatedRefund = await updateRefundStatus(refundId, action, notes);
      setRefundRequests(prev => 
        prev.map(req => req.id === refundId ? updatedRefund : req)
      );
      return updatedRefund;
    } catch (err) {
      console.error('Error updating refund status:', err);
      setError('Failed to update refund status');
      throw err;
    }
  };

  const getRefundDetails = async (refundId) => {
    try {
      setError(null);
      return await getRefundById(refundId);
    } catch (err) {
      console.error('Error fetching refund details:', err);
      setError('Failed to fetch refund details');
      throw err;
    }
  };

  const value = {
    refundRequests,
    loading,
    error,
    initiateRefund,
    handleRefundAction,
    getRefundDetails
  };

  return (
    <RefundContext.Provider value={value}>
      {children}
    </RefundContext.Provider>
  );
} 