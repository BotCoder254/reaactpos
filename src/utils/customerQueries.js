import { db } from '../config/firebase';
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  query,
  where,
  getDocs,
  orderBy,
  limit,
  serverTimestamp,
  Timestamp,
  increment
} from 'firebase/firestore';

// Search customers - simplified version without complex indexes
export async function searchCustomers(searchTerm) {
  try {
    const q = query(
      collection(db, 'customers'),
      orderBy('name'),
      limit(20)
    );
    
    const querySnapshot = await getDocs(q);
    const customers = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Client-side filtering
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      return customers.filter(customer => 
        customer.name?.toLowerCase().includes(term) ||
        customer.phone?.toLowerCase().includes(term) ||
        customer.email?.toLowerCase().includes(term)
      );
    }

    return customers;
  } catch (error) {
    console.error('Error searching customers:', error);
    throw error;
  }
}

// Get customer purchase history
export async function getCustomerPurchases(customerId) {
  try {
    const q = query(
      collection(db, 'sales'),
      where('customerId', '==', customerId),
      orderBy('timestamp', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting customer purchases:', error);
    throw error;
  }
}

// Add a new customer
export async function addCustomer(customerData) {
  try {
    const docRef = await addDoc(collection(db, 'customers'), {
      ...customerData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      lastVisit: null,
      totalSpent: 0,
      visits: 0
    });
    return docRef.id;
  } catch (error) {
    console.error('Error adding customer:', error);
    throw error;
  }
}

// Update a customer
export async function updateCustomer(customerId, customerData) {
  try {
    const customerRef = doc(db, 'customers', customerId);
    await updateDoc(customerRef, {
      ...customerData,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating customer:', error);
    throw error;
  }
}

// Update customer after purchase
export async function updateCustomerAfterPurchase(customerId, saleAmount) {
  try {
    const customerRef = doc(db, 'customers', customerId);
    await updateDoc(customerRef, {
      totalSpent: increment(saleAmount),
      visits: increment(1),
      lastVisit: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating customer after purchase:', error);
    throw error;
  }
}

// Quick search for POS - simplified version
export async function quickSearchCustomers(searchTerm) {
  try {
    const q = query(
      collection(db, 'customers'),
      orderBy('name'),
      limit(10)
    );
    
    const querySnapshot = await getDocs(q);
    const customers = querySnapshot.docs.map(doc => ({
      id: doc.id,
      name: doc.data().name,
      phone: doc.data().phone,
      email: doc.data().email
    }));

    // Client-side filtering
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      return customers.filter(customer => 
        customer.name?.toLowerCase().includes(term) ||
        customer.phone?.toLowerCase().includes(term) ||
        customer.email?.toLowerCase().includes(term)
      );
    }

    return customers;
  } catch (error) {
    console.error('Error quick searching customers:', error);
    throw error;
  }
} 