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
    // Ensure numerical values are properly formatted
    const formattedSaleData = {
      ...saleData,
      total: typeof saleData.total === 'number' ? saleData.total : parseFloat(saleData.total) || 0,
      subtotal: typeof saleData.subtotal === 'number' ? saleData.subtotal : parseFloat(saleData.subtotal) || 0,
      tax: typeof saleData.tax === 'number' ? saleData.tax : parseFloat(saleData.tax) || 0,
      items: Array.isArray(saleData.items) ? saleData.items.map(item => ({
        ...item,
        price: typeof item.price === 'number' ? item.price : parseFloat(item.price) || 0,
        quantity: typeof item.quantity === 'number' ? item.quantity : parseInt(item.quantity) || 0,
        total: typeof item.price === 'number' ? 
          item.price * (typeof item.quantity === 'number' ? item.quantity : parseInt(item.quantity) || 0) :
          parseFloat(item.price) * (typeof item.quantity === 'number' ? item.quantity : parseInt(item.quantity) || 0) || 0
      })) : [],
      status: 'completed',
      createdAt: new Date(),
      timestamp: new Date(),
      amount: typeof saleData.total === 'number' ? saleData.total : parseFloat(saleData.total) || 0
    };

    const docRef = await addDoc(collection(db, 'sales'), formattedSaleData);
    return {
      id: docRef.id,
      ...formattedSaleData
    };
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
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      const total = typeof data.total === 'number' ? data.total : parseFloat(data.total) || 0;
      const subtotal = typeof data.subtotal === 'number' ? data.subtotal : parseFloat(data.subtotal) || 0;
      const tax = typeof data.tax === 'number' ? data.tax : parseFloat(data.tax) || 0;

      return {
        id: doc.id,
        ...data,
        total,
        subtotal,
        tax,
        amount: total,
        timestamp: data.timestamp?.toDate() || new Date(),
        formattedTotal: new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        }).format(total),
        items: Array.isArray(data.items) ? data.items.map(item => ({
          ...item,
          price: typeof item.price === 'number' ? item.price : parseFloat(item.price) || 0,
          quantity: typeof item.quantity === 'number' ? item.quantity : parseInt(item.quantity) || 0,
          total: typeof item.price === 'number' ? 
            item.price * (typeof item.quantity === 'number' ? item.quantity : parseInt(item.quantity) || 0) :
            parseFloat(item.price) * (typeof item.quantity === 'number' ? item.quantity : parseInt(item.quantity) || 0) || 0
        })) : []
      };
    });
  } catch (error) {
    console.error('Error getting sales:', error);
    throw error;
  }
}

export async function exportSales(sales) {
  try {
    const csvData = sales.map(sale => ({
      date: new Date(sale.timestamp).toLocaleString(),
      items: Array.isArray(sale.items) ? sale.items.length : 0,
      subtotal: typeof sale.subtotal === 'number' ? sale.subtotal : parseFloat(sale.subtotal) || 0,
      tax: typeof sale.tax === 'number' ? sale.tax : parseFloat(sale.tax) || 0,
      total: typeof sale.total === 'number' ? sale.total : parseFloat(sale.total) || 0,
      paymentMethod: sale.paymentMethod || 'N/A',
      cashier: sale.cashierName || 'N/A',
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
    // Ensure numerical values are properly formatted
    const formattedSaleData = {
      ...saleData,
      total: parseFloat(saleData.total) || 0,
      subtotal: parseFloat(saleData.subtotal) || 0,
      tax: parseFloat(saleData.tax) || 0,
      items: Array.isArray(saleData.items) ? saleData.items.map(item => ({
        ...item,
        price: parseFloat(item.price) || 0,
        quantity: parseInt(item.quantity) || 0
      })) : []
    };
    
    // This would typically call a Firebase Cloud Function
    console.log('Emailing receipt to:', email, formattedSaleData);
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
    const sales = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        total: typeof data.total === 'number' ? data.total : parseFloat(data.total) || 0,
        subtotal: typeof data.subtotal === 'number' ? data.subtotal : parseFloat(data.subtotal) || 0,
        tax: typeof data.tax === 'number' ? data.tax : parseFloat(data.tax) || 0,
        items: Array.isArray(data.items) ? data.items.map(item => ({
          ...item,
          price: typeof item.price === 'number' ? item.price : parseFloat(item.price) || 0,
          quantity: typeof item.quantity === 'number' ? item.quantity : parseInt(item.quantity) || 0
        })) : []
      };
    });

    // Calculate total sales with proper number handling
    const totalSales = sales.reduce((sum, sale) => {
      const saleTotal = typeof sale.total === 'number' ? sale.total : parseFloat(sale.total) || 0;
      return sum + saleTotal;
    }, 0);

    // Calculate daily sales with proper number handling
    const dailySales = sales.reduce((acc, sale) => {
      const date = sale.timestamp.toDate().toISOString().split('T')[0];
      const saleTotal = typeof sale.total === 'number' ? sale.total : parseFloat(sale.total) || 0;
      acc[date] = (acc[date] || 0) + saleTotal;
      return acc;
    }, {});

    // Calculate sales by category with proper number handling
    const salesByCategory = sales.reduce((acc, sale) => {
      if (Array.isArray(sale.items)) {
        sale.items.forEach(item => {
          const price = typeof item.price === 'number' ? item.price : parseFloat(item.price) || 0;
          const quantity = typeof item.quantity === 'number' ? item.quantity : parseInt(item.quantity) || 0;
          const category = item.category || 'Uncategorized';
          
          if (!acc[category]) {
            acc[category] = 0;
          }
          acc[category] += price * quantity;
        });
      }
      return acc;
    }, {});

    // Convert to arrays for charts with proper number handling
    const dailyData = Object.entries(dailySales).map(([date, amount]) => ({
      date,
      amount: typeof amount === 'number' ? amount : parseFloat(amount) || 0
    }));

    const categoryData = Object.entries(salesByCategory).map(([category, amount]) => ({
      category,
      amount: typeof amount === 'number' ? amount : parseFloat(amount) || 0
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