import { db } from '../config/firebase';
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
    const constraints = [];
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

    constraints.push(where('timestamp', '>=', Timestamp.fromDate(startDate)));

    if (cashierId !== 'all') {
      constraints.push(where('cashierId', '==', cashierId));
    }

    if (productCategory !== 'all') {
      constraints.push(where('items.category', '==', productCategory));
    }

    const q = query(
      collection(db, 'sales'),
      ...constraints,
      orderBy('timestamp', 'desc')
    );

    const querySnapshot = await getDocs(q);
    const sales = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Process sales data
    const totalSales = sales.reduce((sum, sale) => sum + sale.total, 0);
    const totalItems = sales.reduce((sum, sale) => sum + sale.items.length, 0);
    const uniqueCustomers = new Set(sales.map(sale => sale.customerId)).size;

    // Generate sales trend data
    const salesByDate = sales.reduce((acc, sale) => {
      const date = new Date(sale.timestamp.seconds * 1000).toLocaleDateString();
      acc[date] = (acc[date] || 0) + sale.total;
      return acc;
    }, {});

    const salesTrend = Object.entries(salesByDate).map(([date, total]) => ({
      date,
      total
    }));

    return {
      totalSales,
      totalItems,
      totalCustomers: uniqueCustomers,
      salesTrend
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
    salesReport.sales?.forEach(sale => {
      sale.items.forEach(item => {
        if (!productSales[item.id]) {
          productSales[item.id] = {
            name: item.name,
            quantity: 0,
            revenue: 0
          };
        }
        productSales[item.id].quantity += item.quantity;
        productSales[item.id].revenue += item.price * item.quantity;
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

    // Process all sales to get cashier statistics
    salesReport.sales?.forEach(sale => {
      if (!cashierStats[sale.cashierId]) {
        cashierStats[sale.cashierId] = {
          name: sale.cashierName,
          totalSales: 0,
          transactionCount: 0,
          averageTransaction: 0
        };
      }
      cashierStats[sale.cashierId].totalSales += sale.total;
      cashierStats[sale.cashierId].transactionCount += 1;
    });

    // Calculate averages and convert to array
    return Object.entries(cashierStats)
      .map(([id, stats]) => ({
        id,
        ...stats,
        averageTransaction: stats.totalSales / stats.transactionCount
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
    const csvData = [
      {
        'Date Range': dateRange,
        'Total Sales': reportData.totalSales,
        'Total Items': reportData.totalItems,
        'Total Customers': reportData.totalCustomers
      },
      {},
      { 'Sales Trend': '' },
      { Date: 'Total' },
      ...reportData.salesTrend.map(data => ({
        Date: data.date,
        Total: data.total
      }))
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