import { db } from '../firebase';
import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  limit,
  startAt,
  endAt,
  Timestamp
} from 'firebase/firestore';
import Papa from 'papaparse';

// Get sales report data
export async function getSalesReport(dateRange, cashierId = 'all', productCategory = 'all') {
  try {
    const salesRef = collection(db, 'sales');
    const now = new Date();
    let startDate;

    switch (dateRange) {
      case 'today':
        startDate = new Date(now.setHours(0, 0, 0, 0));
        break;
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
        startDate = new Date(now.setDate(now.getDate() - 30));
    }

    let q = query(
      salesRef,
      where('timestamp', '>=', Timestamp.fromDate(startDate)),
      orderBy('timestamp', 'desc')
    );

    if (cashierId !== 'all') {
      q = query(q, where('cashierId', '==', cashierId));
    }

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

      // Ensure total is a valid number
      const total = typeof data.total === 'number' ? data.total : 
                   (parseFloat(data.total) || calculatedTotal);

      return {
        id: doc.id,
        ...data,
        total: parseFloat(total.toFixed(2)),
        items: Array.isArray(data.items) ? data.items.map(item => ({
          ...item,
          price: typeof item.price === 'number' ? item.price : parseFloat(item.price) || 0,
          quantity: typeof item.quantity === 'number' ? item.quantity : parseInt(item.quantity) || 0
        })) : []
      };
    });

    // Filter by product category in memory if needed
    const filteredSales = productCategory === 'all' 
      ? sales 
      : sales.filter(sale => 
          Array.isArray(sale.items) && sale.items.some(item => item.category === productCategory)
        );

    // Process sales data with proper number handling
    const totalSales = parseFloat(filteredSales.reduce((sum, sale) => 
      sum + (sale.total || 0), 0).toFixed(2));

    const totalItems = filteredSales.reduce((sum, sale) => {
      if (!Array.isArray(sale.items)) return sum;
      return sum + sale.items.reduce((itemSum, item) => 
        itemSum + (parseInt(item.quantity) || 0), 0);
    }, 0);

    const uniqueCustomers = new Set(filteredSales.map(sale => sale.customerId)).size;

    // Generate sales trend data with proper number handling
    const salesByDate = filteredSales.reduce((acc, sale) => {
      const date = new Date(sale.timestamp.seconds * 1000).toLocaleDateString();
      acc[date] = (acc[date] || 0) + (sale.total || 0);
      return acc;
    }, {});

    const salesTrend = Object.entries(salesByDate)
      .sort(([dateA], [dateB]) => new Date(dateA) - new Date(dateB))
      .map(([date, total]) => ({
        date,
        total: parseFloat(total.toFixed(2))
      }));

    return {
      totalSales,
      totalItems,
      totalCustomers: uniqueCustomers,
      salesTrend,
      sales: filteredSales
    };
  } catch (error) {
    console.error('Error getting sales report:', error);
    throw error;
  }
}

// Get top products
export async function getTopProducts(dateRange) {
  try {
    const salesReport = await getSalesReport(dateRange);
    const productSales = {};

    // Process all sales to get product totals
    salesReport.sales.forEach(sale => {
      sale.items.forEach(item => {
        if (!productSales[item.productId]) {
          productSales[item.productId] = {
            name: item.name,
            quantity: 0,
            revenue: 0
          };
        }
        productSales[item.productId].quantity += item.quantity;
        productSales[item.productId].revenue += item.price * item.quantity;
      });
    });

    // Convert to array and sort by revenue
    return Object.entries(productSales)
      .map(([id, data]) => ({
        id,
        ...data
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);
  } catch (error) {
    console.error('Error getting top products:', error);
    throw error;
  }
}

// Get cashier performance
export async function getCashierPerformance(dateRange) {
  try {
    const salesReport = await getSalesReport(dateRange);
    const cashierStats = {};

    // First get all cashiers
    const cashiersRef = collection(db, 'users');
    const cashiersQuery = query(cashiersRef, where('role', '==', 'cashier'));
    const cashiersSnapshot = await getDocs(cashiersQuery);
    
    // Initialize stats for all cashiers
    cashiersSnapshot.docs.forEach(doc => {
      cashierStats[doc.id] = {
        id: doc.id,
        name: doc.data().name || 'Unknown',
        email: doc.data().email || '',
        totalSales: 0,
        transactionCount: 0,
        averageTransaction: 0,
        itemsSold: 0
      };
    });

    // Process all sales to get cashier statistics
    salesReport.sales.forEach(sale => {
      if (cashierStats[sale.cashierId]) {
        cashierStats[sale.cashierId].totalSales += sale.total;
        cashierStats[sale.cashierId].transactionCount += 1;
        cashierStats[sale.cashierId].itemsSold += sale.items.reduce((sum, item) => sum + item.quantity, 0);
      }
    });

    // Calculate averages and convert to array
    return Object.values(cashierStats)
      .map(stats => ({
        ...stats,
        averageTransaction: stats.transactionCount > 0 
          ? stats.totalSales / stats.transactionCount 
          : 0
      }))
      .sort((a, b) => b.totalSales - a.totalSales);
  } catch (error) {
    console.error('Error getting cashier performance:', error);
    throw error;
  }
}

// Export sales report
export async function exportSalesReport(reportData, dateRange) {
  try {
    // Format data for CSV
    const salesData = reportData.salesTrend.map(data => ({
      Date: data.date,
      Sales: data.total.toFixed(2)
    }));

    const summaryData = [
      {
        'Report Summary': '',
        'Date Range': dateRange,
        'Total Sales': reportData.totalSales.toFixed(2),
        'Total Items': reportData.totalItems,
        'Total Customers': reportData.totalCustomers
      }
    ];

    // Combine all data
    const csvData = [
      ...summaryData,
      { '': '' }, // Empty row for spacing
      { 'Daily Sales': '' },
      ...salesData
    ];

    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `sales_report_${dateRange}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  } catch (error) {
    console.error('Error exporting sales report:', error);
    throw error;
  }
} 