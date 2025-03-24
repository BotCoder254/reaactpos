import { db } from '../firebase';
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  Timestamp
} from 'firebase/firestore';
import Papa from 'papaparse';

export async function createSale(saleData) {
  try {
    const docRef = await addDoc(collection(db, 'sales'), {
      ...saleData,
      status: 'completed',
      createdAt: new Date(),
    });
    return docRef.id;
  } catch (error) {
    console.error('Error creating sale:', error);
    throw error;
  }
}

export async function getSales(dateRange = 'today', cashierId = 'all', paymentMethod = 'all') {
  try {
    let constraints = [];
    const now = new Date();

    switch (dateRange) {
      case 'today':
        const startOfDay = new Date(now.setHours(0, 0, 0, 0));
        const endOfDay = new Date(now.setHours(23, 59, 59, 999));
        constraints.push(
          where('timestamp', '>=', Timestamp.fromDate(startOfDay)),
          where('timestamp', '<=', Timestamp.fromDate(endOfDay))
        );
        break;
      case 'week':
        const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
        constraints.push(where('timestamp', '>=', Timestamp.fromDate(startOfWeek)));
        break;
      case 'month':
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        constraints.push(where('timestamp', '>=', Timestamp.fromDate(startOfMonth)));
        break;
      case 'year':
        const startOfYear = new Date(now.getFullYear(), 0, 1);
        constraints.push(where('timestamp', '>=', Timestamp.fromDate(startOfYear)));
        break;
    }

    if (cashierId !== 'all') {
      constraints.push(where('cashierId', '==', cashierId));
    }

    if (paymentMethod !== 'all') {
      constraints.push(where('paymentMethod', '==', paymentMethod));
    }

    const q = query(
      collection(db, 'sales'),
      ...constraints,
      orderBy('timestamp', 'desc')
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error('Error getting sales:', error);
    throw error;
  }
}

export async function exportSales(sales) {
  try {
    const csvData = sales.map(sale => ({
      date: new Date(sale.timestamp).toLocaleString(),
      items: sale.items.length,
      subtotal: sale.subtotal,
      tax: sale.tax,
      total: sale.total,
      paymentMethod: sale.paymentMethod,
      cashier: sale.cashierName,
    }));

    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `sales_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  } catch (error) {
    console.error('Error exporting sales:', error);
    throw error;
  }
}

export async function emailReceipt(saleData, email) {
  try {
    // This would typically call a Firebase Cloud Function
    console.log('Emailing receipt to:', email, saleData);
    return true;
  } catch (error) {
    console.error('Error emailing receipt:', error);
    throw error;
  }
}

export const getSalesAnalytics = async (period = 'month') => {
  try {
    const now = new Date();
    let startDate;

    switch (period) {
      case 'week':
        startDate = new Date(now.setDate(now.getDate() - 7));
        break;
      case 'month':
        startDate = new Date(now.setMonth(now.getMonth() - 1));
        break;
      case 'year':
        startDate = new Date(now.setFullYear(now.getFullYear() - 1));
        break;
      default:
        startDate = new Date(now.setMonth(now.getMonth() - 1));
    }

    const salesRef = collection(db, 'sales');
    const q = query(
      salesRef,
      where('timestamp', '>=', Timestamp.fromDate(startDate)),
      where('timestamp', '<=', Timestamp.fromDate(new Date())),
      orderBy('timestamp', 'desc')
    );

    const querySnapshot = await getDocs(q);
    const sales = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Calculate total sales
    const totalSales = sales.reduce((sum, sale) => sum + sale.total, 0);

    // Calculate daily sales
    const dailySales = sales.reduce((acc, sale) => {
      const date = sale.timestamp.toDate().toISOString().split('T')[0];
      if (!acc[date]) {
        acc[date] = 0;
      }
      acc[date] += sale.total;
      return acc;
    }, {});

    // Calculate sales by category
    const salesByCategory = sales.reduce((acc, sale) => {
      sale.items.forEach(item => {
        if (!acc[item.category]) {
          acc[item.category] = 0;
        }
        acc[item.category] += item.price * item.quantity;
      });
      return acc;
    }, {});

    // Convert to arrays for charts
    const dailyData = Object.entries(dailySales).map(([date, amount]) => ({
      date,
      amount
    }));

    const categoryData = Object.entries(salesByCategory).map(([category, amount]) => ({
      category,
      amount
    }));

    return {
      totalSales,
      dailySales: dailyData,
      salesByCategory: categoryData,
      saleCount: sales.length
    };
  } catch (error) {
    console.error('Error getting sales analytics:', error);
    throw error;
  }
};