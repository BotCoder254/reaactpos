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
  today.setHours(0, 0, 0, 0);
  
  const salesRef = collection(db, 'sales');
  const q = query(
    salesRef,
    where('timestamp', '>=', today),
    orderBy('timestamp', 'desc')
  );

  const querySnapshot = await getDocs(q);
  let totalSales = 0;
  const sales = querySnapshot.docs.map(doc => {
    const data = doc.data();
    // Calculate total from items if total is not present or invalid
    let calculatedTotal = 0;
    if (Array.isArray(data.items)) {
      calculatedTotal = data.items.reduce((sum, item) => {
        const price = typeof item.price === 'number' ? item.price : parseFloat(item.price) || 0;
        const quantity = typeof item.quantity === 'number' ? item.quantity : parseInt(item.quantity) || 0;
        return sum + (price * quantity);
      }, 0);
    }

    // Ensure total is a valid number
    const rawTotal = typeof data.total === 'number' ? data.total : parseFloat(data.total) || calculatedTotal;
    const total = parseFloat(rawTotal.toFixed(2)); // Round to 2 decimal places
    totalSales += total;

    return {
      id: doc.id,
      total: total,
      amount: new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(total),
      items: Array.isArray(data.items) ? data.items.length : 0,
      timestamp: formatTimestamp(data.timestamp)
    };
  });

  return {
    sales,
    totalSales: parseFloat(totalSales.toFixed(2)),
    formattedTotal: new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(totalSales)
  };
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
  const sales = querySnapshot.docs.map(doc => {
    const data = doc.data();
    // Calculate total from items if total is not present or invalid
    let calculatedTotal = 0;
    if (Array.isArray(data.items)) {
      calculatedTotal = data.items.reduce((sum, item) => {
        const price = typeof item.price === 'number' ? item.price : parseFloat(item.price) || 0;
        const quantity = typeof item.quantity === 'number' ? item.quantity : parseInt(item.quantity) || 0;
        return sum + (price * quantity);
      }, 0);
    }

    return {
      id: doc.id,
      ...data,
      total: typeof data.total === 'number' ? data.total : parseFloat(data.total) || calculatedTotal,
      timestamp: data.timestamp?.toDate() || new Date()
    };
  });

  // Group by day with proper number handling
  const dailySales = sales.reduce((acc, sale) => {
    const date = sale.timestamp.toLocaleDateString('en-US', { weekday: 'short' });
    const total = typeof sale.total === 'number' ? sale.total : parseFloat(sale.total) || 0;
    
    if (!acc[date]) {
      acc[date] = 0;
    }
    acc[date] += total;
    return acc;
  }, {});

  return Object.entries(dailySales).map(([name, sales]) => ({
    name,
    sales: typeof sales === 'number' ? sales : parseFloat(sales) || 0
  }));
}

// Get recent transactions
export async function getRecentTransactions(limitCount = 5) {
  const salesRef = collection(db, 'sales');
  const q = query(
    salesRef,
    orderBy('timestamp', 'desc'),
    limit(limitCount)
  );

  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => {
    const data = doc.data();
    // Calculate total from items if total is not present or invalid
    let calculatedTotal = 0;
    if (Array.isArray(data.items)) {
      calculatedTotal = data.items.reduce((sum, item) => {
        const price = typeof item.price === 'number' ? item.price : parseFloat(item.price) || 0;
        const quantity = typeof item.quantity === 'number' ? item.quantity : parseInt(item.quantity) || 0;
        return sum + (price * quantity);
      }, 0);
    }

    // Ensure total is a valid number
    const rawTotal = typeof data.total === 'number' ? data.total : parseFloat(data.total) || calculatedTotal;
    const total = parseFloat(rawTotal.toFixed(2)); // Round to 2 decimal places
    
    return {
      id: doc.id,
      total: total,
      amount: new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(total),
      status: data.status || 'completed',
      date: formatTimestamp(data.timestamp),
      items: Array.isArray(data.items) ? data.items.length : 0
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

  // Get today's sales with proper number handling
  const todaySales = await getDailySales();
  const totalSales = todaySales.totalSales;
  
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
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
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