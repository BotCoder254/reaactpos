import { db } from '../firebase';
import { collection, addDoc, getDoc, doc, updateDoc, query, where, getDocs } from 'firebase/firestore';
import { generateQRCode } from './qrCodeUtils';
import { logActivity } from './activityLog';
import { formatInvoiceNumber } from './formatters';

export const createDigitalReceipt = async (saleData) => {
  try {
    const receiptRef = collection(db, 'digitalReceipts');
    const receiptData = {
      ...saleData,
      createdAt: new Date(),
      status: 'active',
      viewed: false,
      rating: null,
      feedback: null,
      qrCodeUrl: null
    };

    // Create the receipt document first
    const docRef = await addDoc(receiptRef, receiptData);
    
    // Generate QR code with the receipt ID
    const qrCodeUrl = await generateQRCode(`${window.location.origin}/receipt/${docRef.id}`);
    
    // Update the receipt with the QR code URL
    await updateDoc(doc(db, 'digitalReceipts', docRef.id), {
      qrCodeUrl
    });

    await logActivity({
      type: 'digital_receipt_created',
      details: `Created digital receipt for sale ${saleData.id}`,
      metadata: {
        receiptId: docRef.id,
        saleId: saleData.id
      }
    });

    return {
      id: docRef.id,
      ...receiptData,
      qrCodeUrl
    };
  } catch (error) {
    console.error('Error creating digital receipt:', error);
    throw error;
  }
};

export const sendDigitalReceipt = async (saleId, email, phone = null) => {
  try {
    // Create digital receipt first
    const saleRef = doc(db, 'sales', saleId);
    const saleDoc = await getDoc(saleRef);
    
    if (!saleDoc.exists()) {
      throw new Error('Sale not found');
    }

    const saleData = saleDoc.data();
    const receipt = await createDigitalReceipt({
      ...saleData,
      invoiceNumber: formatInvoiceNumber(new Date()),
      sentTo: { email, phone }
    });

    // Store the email sending record
    await addDoc(collection(db, 'emailLogs'), {
      type: 'digital_receipt',
      receiptId: receipt.id,
      saleId,
      email,
      phone,
      status: 'sent',
      sentAt: new Date()
    });

    await logActivity({
      type: 'digital_receipt_sent',
      details: `Sent digital receipt for sale ${saleId} to ${email}`,
      metadata: {
        receiptId: receipt.id,
        saleId,
        email,
        phone
      }
    });

    return receipt;
  } catch (error) {
    console.error('Error sending digital receipt:', error);
    throw error;
  }
};

export const getDigitalReceipt = async (receiptId) => {
  try {
    const receiptRef = doc(db, 'digitalReceipts', receiptId);
    const receiptDoc = await getDoc(receiptRef);

    if (!receiptDoc.exists()) {
      throw new Error('Receipt not found');
    }

    // Mark receipt as viewed
    if (!receiptDoc.data().viewed) {
      await updateDoc(receiptRef, {
        viewed: true,
        lastViewedAt: new Date()
      });
    }

    return {
      id: receiptDoc.id,
      ...receiptDoc.data()
    };
  } catch (error) {
    console.error('Error getting digital receipt:', error);
    throw error;
  }
};

export const submitReceiptRating = async (receiptId, rating, feedback = '') => {
  try {
    const receiptRef = doc(db, 'digitalReceipts', receiptId);
    await updateDoc(receiptRef, {
      rating,
      feedback,
      ratedAt: new Date()
    });

    await logActivity({
      type: 'receipt_rating_submitted',
      details: `Rating submitted for receipt ${receiptId}`,
      metadata: {
        receiptId,
        rating,
        hasFeedback: !!feedback
      }
    });

    return true;
  } catch (error) {
    console.error('Error submitting receipt rating:', error);
    throw error;
  }
};

export const getReceiptByQRCode = async (qrCode) => {
  try {
    const receiptsRef = collection(db, 'digitalReceipts');
    const q = query(receiptsRef, where('qrCodeUrl', '==', qrCode));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      throw new Error('Receipt not found');
    }

    const receiptDoc = querySnapshot.docs[0];
    return {
      id: receiptDoc.id,
      ...receiptDoc.data()
    };
  } catch (error) {
    console.error('Error getting receipt by QR code:', error);
    throw error;
  }
}; 