import { addDoc, collection } from 'firebase/firestore';
import { db } from '../firebase';
import { logActivity } from './activityLog';

export const processPayment = async (orderData, paymentMethod) => {
  try {
    // In a real application, you would integrate with a payment gateway here
    const paymentDetails = {
      amount: orderData.total,
      method: paymentMethod,
      status: 'completed',
      timestamp: new Date(),
      orderId: orderData.id
    };

    // Save payment record to database
    const paymentsRef = collection(db, 'payments');
    const paymentDoc = await addDoc(paymentsRef, paymentDetails);

    // Log the payment activity
    await logActivity({
      type: 'payment',
      action: 'processed',
      details: `Payment processed for order ${orderData.id}`,
      amount: orderData.total,
      paymentId: paymentDoc.id
    });

    return {
      success: true,
      paymentId: paymentDoc.id
    };
  } catch (error) {
    console.error('Payment processing error:', error);
    throw new Error('Failed to process payment');
  }
};

export const validatePaymentMethod = (method) => {
  const validMethods = ['cash', 'card', 'mobile'];
  return validMethods.includes(method.toLowerCase());
}; 