import { db } from '../firebase';
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  Timestamp,
  startOfDay,
  endOfDay,
} from 'firebase/firestore';

// Get daily sales data
export async function getDailySales() {
  const today = new Date();
  const startOfToday = new Date(today.setHours(0, 0, 0, 0));
  const endOfToday = new Date(today.setHours(23, 59, 59, 999));

  const salesRef = collection(db, 'sales');
  const q = query(
    salesRef,
    where('timestamp', '>=', Timestamp.fromDate(startOfToday)),
    where('timestamp', '<=', Timestamp.fromDate(endOfToday)),
    orderBy('timestamp', 'desc')
  );

  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
}

// Get weekly sales data
export async function getWeeklySales() {
  const today = new Date();
  const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

  const salesRef = collection(db, 'sales');
  const q = query(
    salesRef,
    where('timestamp', '>=', Timestamp.fromDate(lastWeek)),
    orderBy('timestamp', 'desc')
  );

  const querySnapshot = await getDocs(q);
  const sales = querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));

  // Group by day
  const dailySales = sales.reduce((acc, sale) => {
    const date = sale.timestamp.toDate();
    const day = date.toLocaleDateString('en-US', { weekday: 'short' });
    
    if (!acc[day]) {
      acc[day] = 0;
    }
    acc[day] += sale.total;
    return acc;
  }, {});

  return Object.entries(dailySales).map(([name, sales]) => ({
    name,
    sales
  }));
}

// Get recent transactions
export async function getRecentTransactions(limit = 5) {
  const salesRef = collection(db, 'sales');
  const q = query(
    salesRef,
    orderBy('timestamp', 'desc'),
    limit(limit)
  );

  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      amount: data.total.toLocaleString('en-US', {
        style: 'currency',
        currency: 'USD'
      }),
      status: data.status,
      date: formatTimestamp(data.timestamp),
      items: data.items.length
    };
  });
}

// Get low stock items
export async function getLowStockItems() {
  const productsRef = collection(db, 'products');
  const q = query(
    productsRef,
    where('currentStock', '<=', 'minStock')
  );

  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      name: data.name,
      currentStock: data.currentStock,
      minStock: data.minStock,
      category: data.category
    };
  });
}

// Get dashboard stats
export async function getDashboardStats() {
  const today = new Date();
  const startOfToday = new Date(today.setHours(0, 0, 0, 0));

  // Get today's sales
  const todaySales = await getDailySales();
  const totalSales = todaySales.reduce((sum, sale) => sum + sale.total, 0);
  
  // Get total transactions
  const salesRef = collection(db, 'sales');
  const salesQuery = query(
    salesRef,
    where('timestamp', '>=', Timestamp.fromDate(startOfToday))
  );
  const salesSnapshot = await getDocs(salesQuery);
  
  // Get active staff
  const usersRef = collection(db, 'users');
  const usersQuery = query(
    usersRef,
    where('status', '==', 'active')
  );
  const usersSnapshot = await getDocs(usersQuery);
  
  // Get low stock items count
  const lowStockItems = await getLowStockItems();

  return [
    {
      name: 'Total Sales',
      value: totalSales.toLocaleString('en-US', {
        style: 'currency',
        currency: 'USD'
      }),
      change: '+12.5%', // You can calculate this by comparing with previous day
      icon: 'CurrencyDollarIcon',
      changeType: 'positive'
    },
    {
      name: 'Total Transactions',
      value: salesSnapshot.size.toString(),
      change: '+5.25%',
      icon: 'ShoppingCartIcon',
      changeType: 'positive'
    },
    {
      name: 'Active Staff',
      value: usersSnapshot.size.toString(),
      change: '0%',
      icon: 'UserGroupIcon',
      changeType: 'neutral'
    },
    {
      name: 'Low Stock Items',
      value: lowStockItems.length.toString(),
      change: `-${lowStockItems.length}`,
      icon: 'ExclamationCircleIcon',
      changeType: 'negative'
    }
  ];
}

function formatTimestamp(timestamp) {
  const now = new Date();
  const date = timestamp.toDate();
  const diffInMinutes = Math.floor((now - date) / (1000 * 60));

  if (diffInMinutes < 60) {
    return `${diffInMinutes} minutes ago`;
  } else if (diffInMinutes < 1440) {
    const hours = Math.floor(diffInMinutes / 60);
    return `${hours} hours ago`;
  } else {
    return date.toLocaleDateString();
  }
} 